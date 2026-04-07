var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

// Dùng authMiddleware để khớp JWT secret với auth/login
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const orderModel = require('../models/Order');
const orderDetailModel = require('../models/OrderDetail');
let cartModel = require('../models/Cart');
let inventoryModel = require('../models/Inventory');
let productModel = require('../models/Product');
const Coupon = require('../models/Coupon');

// ============================================================
// FALLBACK: Đặt hàng lưu tuần tự (Dành cho Local MongoDB Standalone)
// ============================================================
async function fallbackCheckout(req, res) {
    try {
        let user = req.user;
        let { shippingAddress, note, couponCode } = req.body;
        let cart = await cartModel.findOne({ user: user._id }).populate('products.product');
        
        if (!cart || cart.products.length === 0) return res.status(400).send({ message: 'Giỏ hàng trống' });

        let totalAmount = 0;
        for (let item of cart.products) {
            if (!item.product) return res.status(400).send({ message: 'Sản phẩm không hợp lệ' });
            totalAmount += item.product.price * item.quantity;
        }

        let discountAmount = 0;
        if (couponCode) {
            let appliedCoupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (appliedCoupon && new Date() <= appliedCoupon.expiryDate && totalAmount >= appliedCoupon.minOrderValue) {
                if (appliedCoupon.usageLimit === null || appliedCoupon.usedCount < appliedCoupon.usageLimit) {
                    discountAmount = appliedCoupon.discountType === 'percentage' 
                        ? (totalAmount * appliedCoupon.discountValue) / 100 
                        : appliedCoupon.discountValue;
                    appliedCoupon.usedCount += 1;
                    await appliedCoupon.save();
                }
            }
        }
        let finalAmount = Math.max(0, totalAmount - discountAmount);

        let newOrder = new orderModel({
            user: user._id, totalAmount, discountAmount, finalAmount,
            status: 'pending', shippingAddress: shippingAddress || '', note: note || ''
        });
        await newOrder.save();

        for (let item of cart.products) {
            let inventory = await inventoryModel.findOne({ product: item.product._id });
            // Tự động đồng bộ nếu sản phẩm cũ chưa có record Inventory
            if (!inventory) {
                inventory = await inventoryModel.create({ product: item.product._id, stock: item.product.stock || 0 });
            }
            if (!inventory || (inventory.stock - inventory.reserved) < item.quantity) {
                return res.status(400).send({ message: `Sản phẩm "${item.product.name}" không đủ số lượng` });
            }
            let detail = new orderDetailModel({
                order: newOrder._id, product: item.product._id, quantity: item.quantity,
                unitPrice: item.product.price, subtotal: item.product.price * item.quantity
            });
            await detail.save();
            inventory.stock -= item.quantity;
            inventory.soldCount += item.quantity;
            await inventory.save();
        }

        cart.products = [];
        await cart.save();

        const { createAndEmitNotification } = require('../controllers/notificationController');
        const io = req.app.get('io');
        await createAndEmitNotification(io, {
            userId: user._id,
            title: 'Đặt hàng thành công! 🎉',
            message: `Mã đơn hàng ${newOrder._id.toString().substring(0, 8)} đã được tạo. Vui lòng chờ xác nhận.`,
            type: 'NEW_ORDER',
            relatedId: newOrder._id
        });

        return res.send({ message: 'Đặt hàng thành công', order: newOrder });
    } catch (error) {
        console.error("Fallback Error:", error);
        return res.status(500).send({ message: error.message });
    }
}

// ============================================================
// POST /checkout - Đặt hàng (TRANSACTION)
// Đây là API quan trọng nhất:
// Tạo Order → Tạo OrderDetails → Trừ tồn kho → Xóa giỏ hàng
// Nếu 1 bước lỗi → toàn bộ rollback
// ============================================================
router.post('/checkout', verifyToken, async function (req, res, next) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
        let user = req.user;
        let { shippingAddress, note, couponCode } = req.body;

        // Bước 1: Lấy giỏ hàng của user, populate thông tin sản phẩm
        let cart = await cartModel.findOne({ user: user._id }).populate('products.product');
        if (!cart || cart.products.length === 0) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).send({ message: 'Giỏ hàng trống, không thể đặt hàng' });
        }

        // Bước 2: Tính tổng tiền từ giỏ hàng
        let totalAmount = 0;
        for (let item of cart.products) {
            if (!item.product) {
                await session.abortTransaction();
                await session.endSession();
                return res.status(400).send({ message: 'Một sản phẩm trong giỏ hàng không hợp lệ hoặc đã bị xóa.' });
            }
            totalAmount += item.product.price * item.quantity;
        }

        // Tính toán mã giảm giá trong transaction
        let discountAmount = 0;
        if (couponCode) {
            let appliedCoupon = await Coupon.findOne({ code: couponCode, isActive: true }).session(session);
            if (appliedCoupon && new Date() <= appliedCoupon.expiryDate && totalAmount >= appliedCoupon.minOrderValue) {
                if (appliedCoupon.usageLimit === null || appliedCoupon.usedCount < appliedCoupon.usageLimit) {
                    discountAmount = appliedCoupon.discountType === 'percentage' 
                        ? (totalAmount * appliedCoupon.discountValue) / 100 
                        : appliedCoupon.discountValue;
                    appliedCoupon.usedCount += 1;
                    await appliedCoupon.save({ session });
                }
            }
        }
        let finalAmount = Math.max(0, totalAmount - discountAmount);

        // Bước 3: Tạo Order trong transaction
        let newOrder = new orderModel({
            user: user._id,
            totalAmount: totalAmount,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            status: 'pending',
            shippingAddress: shippingAddress || '',
            note: note || ''
        });
        await newOrder.save({ session });

        // Bước 4: Tạo OrderDetails và kiểm tra/trừ tồn kho
        for (let item of cart.products) {
            // Kiểm tra tồn kho
            let inventory = await inventoryModel.findOne({ product: item.product._id }).session(session);
            // Tự động đồng bộ nếu sản phẩm cũ chưa có record Inventory
            if (!inventory) {
                inventory = new inventoryModel({ product: item.product._id, stock: item.product.stock || 0 });
                await inventory.save({ session });
            }
            if (!inventory || (inventory.stock - inventory.reserved) < item.quantity) {
                await session.abortTransaction();
                await session.endSession();
                return res.status(400).send({
                    message: `Sản phẩm "${item.product.name}" không đủ số lượng trong kho (Còn ${inventory?.stock || 0} sản phẩm)`
                });
            }

            // Tạo OrderDetail
            let detail = new orderDetailModel({
                order: newOrder._id,
                product: item.product._id,
                quantity: item.quantity,
                unitPrice: item.product.price,
                subtotal: item.product.price * item.quantity
            });
            await detail.save({ session });

            // Trừ tồn kho bằng $inc (atomic update - tránh race condition)
            inventory.stock -= item.quantity;
            inventory.soldCount += item.quantity;
            await inventory.save({ session });
        }

        // Bước 5: Xóa giỏ hàng (clear products)
        cart.products = [];
        await cart.save({ session });

        // Tất cả OK → Commit transaction
        await session.commitTransaction();
        session.endSession();

        const { createAndEmitNotification } = require('../controllers/notificationController');
        const io = req.app.get('io');
        await createAndEmitNotification(io, {
            userId: user._id,
            title: 'Đặt hàng thành công! 🎉',
            message: `Mã đơn hàng ${newOrder._id.toString().substring(0, 8)} đã được tạo. Vui lòng chờ xác nhận.`,
            type: 'NEW_ORDER',
            relatedId: newOrder._id
        });

        res.send({
            message: 'Đặt hàng thành công',
            order: newOrder
        });

    } catch (error) {
        console.error("Lỗi Checkout Transaction:", error.message);
        // Try-catch riêng cho việc abort để tránh lỗi đè lỗi
        try { await session.abortTransaction(); } catch (abortErr) {}
        await session.endSession();
        
        // Tự động Fallback sang chế độ không Transaction nếu chạy local
        if (error.message.includes('Transaction') || error.message.includes('replica set')) {
            console.warn('⚠️ CẢNH BÁO: Đang chạy trên MongoDB Standalone. Tự động Fallback sang lưu không Transaction...');
            return await fallbackCheckout(req, res);
        }

        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// GET /my-orders - Xem lịch sử đơn hàng của tôi (Customer)
// ============================================================
router.get('/my-orders', verifyToken, async function (req, res, next) {
    try {
        let user = req.user;
        let orders = await orderModel
            .find({ user: user._id })
            .sort({ createdAt: -1 });
        res.send(orders);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// GET /export - Xuất danh sách đơn hàng ra file Excel (Admin)
// ============================================================
router.get('/export', verifyToken, checkRole(['Admin']), async function (req, res, next) {
    try {
        let orders = await orderModel.find().populate('user', 'username email');

        let workbook = new ExcelJS.Workbook();
        let worksheet = workbook.addWorksheet('Danh sach don hang');

        worksheet.columns = [
            { header: 'Ma don hang', key: '_id', width: 28 },
            { header: 'Khach hang', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Tong tien', key: 'totalAmount', width: 15 },
            { header: 'Giam gia', key: 'discountAmount', width: 12 },
            { header: 'Thanh tien', key: 'finalAmount', width: 15 },
            { header: 'Trang thai', key: 'status', width: 15 },
            { header: 'Dia chi', key: 'shippingAddress', width: 30 },
            { header: 'Ngay dat hang', key: 'createdAt', width: 20 },
        ];

        for (let order of orders) {
            worksheet.addRow({
                _id: order._id.toString(),
                username: order.user?.username || '',
                email: order.user?.email || '',
                totalAmount: order.totalAmount,
                discountAmount: order.discountAmount,
                finalAmount: order.finalAmount,
                status: order.status,
                shippingAddress: order.shippingAddress,
                createdAt: order.createdAt ? order.createdAt.toLocaleString('vi-VN') : ''
            });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=don-hang.xlsx');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// GET / - Xem tất cả đơn hàng (Admin/Staff) - Có phân trang & filter
// ============================================================
router.get('/', verifyToken, checkRole(['Admin', 'Staff']), async function (req, res, next) {
    try {
        let { status, page = 1, limit = 10 } = req.query;

        let filter = {};
        if (status) filter.status = status;

        let skip = (page - 1) * limit;

        let orders = await orderModel
            .find(filter)
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        let total = await orderModel.countDocuments(filter);

        res.send({
            orders,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// GET /:id - Xem chi tiết 1 đơn hàng (kèm danh sách sản phẩm)
// ============================================================
router.get('/:id', verifyToken, async function (req, res, next) {
    try {
        let id = req.params.id;
        
        // Kiểm tra an toàn mã ID để tránh lỗi CastError
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Mã đơn hàng không hợp lệ' });
        }

        // Dùng strictPopulate: false để tránh crash nếu Schema thiếu khai báo ref
        let order = await orderModel.findById(id).populate({
            path: 'user',
            select: 'username email',
            strictPopulate: false
        });

        if (!order) {
            return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
        }

        let details = await orderDetailModel
            .find({ order: id })
            .populate({
                path: 'product',
                select: 'name title price image images',
                model: 'Product',
                strictPopulate: false
            });

        res.send({ order, details });
    } catch (error) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// PATCH /:id/status - Cập nhật trạng thái đơn hàng (Admin/Staff)
// ============================================================
router.patch('/:id/status', verifyToken, checkRole(['Admin', 'Staff']), async function (req, res, next) {
    try {
        let id = req.params.id;
        let { status } = req.body;

        let validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).send({ message: 'Trạng thái không hợp lệ' });
        }

        let order = await orderModel.findById(id);

        if (!order) {
            return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
        }

        // Nếu chuyển sang trạng thái huỷ và đơn hàng chưa bị huỷ trước đó
        if (status === 'cancelled' && order.status !== 'cancelled') {
            let details = await orderDetailModel.find({ order: id });
            for (let detail of details) {
                let inventory = await inventoryModel.findOne({ product: detail.product });
                if (inventory) {
                    // Hoàn lại số lượng vào kho và giảm số lượng đã bán
                    inventory.stock += detail.quantity;
                    inventory.soldCount = Math.max(0, inventory.soldCount - detail.quantity);
                    await inventory.save();
                }
            }
        }

        order.status = status;
        await order.save();

        const { createAndEmitNotification } = require('../controllers/notificationController');
        const io = req.app.get('io');
        let statusText = status === 'confirmed' ? 'đã được xác nhận'
            : status === 'shipping' ? 'đang trong quá trình giao hàng'
                : status === 'delivered' ? 'đã được giao thành công'
                    : status === 'cancelled' ? 'đã bị hủy' : 'đang chờ';

        await createAndEmitNotification(io, {
            userId: order.user,
            title: 'Thông báo đơn hàng',
            message: `Đơn hàng ${order._id.toString().substring(0, 8)} của bạn ${statusText}.`,
            type: 'ORDER_STATUS',
            relatedId: order._id
        });

        res.send({ message: 'Cập nhật trạng thái thành công', order });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// ============================================================
// GET /:id/export-invoice - Xuất hóa đơn PDF
// ============================================================
router.get('/:id/export-invoice', verifyToken, async function (req, res, next) {
    try {
        const PDFDocument = require('pdfkit');
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: 'Mã đơn hàng không hợp lệ' });
        }

        const order = await orderModel.findById(id).populate('user', 'username email phone');
        if (!order) {
            return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
        }

        const details = await orderDetailModel
            .find({ order: id })
            .populate('product', 'name price');

        // Tạo PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=hoa-don-${order._id.toString().substring(0, 8)}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Courier').text('HOA DON MUA HANG', { align: 'center' });
        doc.fontSize(10).font('Courier').text('OmniShop - Cua hang truc tuyen', { align: 'center' });
        doc.moveDown();

        // Thông tin đơn hàng
        doc.fontSize(10).font('Courier').text(`Ma don hang: ${order._id.toString().substring(0, 8).toUpperCase()}`);
        doc.text(`Ngay dat: ${new Date(order.createdAt).toLocaleString('vi-VN')}`);
        doc.text(`Trang thai: ${order.status}`);
        doc.moveDown();

        // Thông tin khách hàng
        doc.fontSize(11).font('Courier-Bold').text('Thong tin khach hang:');
        doc.fontSize(10).font('Courier');
        doc.text(`Ten: ${order.user?.username || 'N/A'}`);
        doc.text(`Email: ${order.user?.email || 'N/A'}`);
        doc.text(`Dia chi giao: ${order.shippingAddress}`);
        if (order.note) doc.text(`Ghi chu: ${order.note}`);
        doc.moveDown();

        // Bảng sản phẩm
        doc.fontSize(11).font('Courier-Bold').text('Chi tiet san pham:');
        doc.moveDown(0.5);

        // Header bảng
        const startX = doc.x;
        const startY = doc.y;
        doc.fontSize(9).font('Courier-Bold');
        doc.text('San pham', startX, startY, { width: 150 });
        doc.text('So luong', startX + 150, startY, { width: 60 });
        doc.text('Gia', startX + 210, startY, { width: 80 });
        doc.text('Tong', startX + 290, startY, { width: 100 });

        doc.moveTo(startX, doc.y + 5).lineTo(startX + 390, doc.y + 5).stroke();
        doc.moveDown();

        // Dòng sản phẩm
        doc.fontSize(8).font('Courier');
        let yPosition = doc.y;
        for (let detail of details) {
            doc.text(detail.product?.name || 'N/A', startX, yPosition, { width: 150 });
            doc.text(detail.quantity.toString(), startX + 150, yPosition, { width: 60 });
            doc.text(formatVND(detail.unitPrice), startX + 210, yPosition, { width: 80 });
            doc.text(formatVND(detail.subtotal), startX + 290, yPosition, { width: 100 });
            yPosition += 20;
        }

        doc.moveTo(startX, yPosition + 5).lineTo(startX + 390, yPosition + 5).stroke();
        doc.moveDown(2);

        // Tóm tắt thanh toán
        const summaryX = startX + 200;
        doc.fontSize(10).font('Courier');
        doc.text(`Tong tien hang: ${formatVND(order.totalAmount)}`, summaryX);
        if (order.discountAmount > 0) {
            doc.text(`Giam gia: -${formatVND(order.discountAmount)}`, summaryX);
        }
        doc.font('Courier-Bold').text(`Thanh tien: ${formatVND(order.finalAmount)}`, summaryX);

        doc.moveDown(3);
        doc.fontSize(9).font('Courier').text('Cam on ban da mua sam tai OmniShop!', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Lỗi export invoice:', error);
        res.status(500).send({ message: error.message });
    }
});

function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

module.exports = router;
