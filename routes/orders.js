var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');

// Dùng authMiddleware để khớp JWT secret với auth/login
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const orderModel = require('../models/Order');
const orderDetailModel = require('../models/OrderDetail');
let cartModel = require('../schemas/carts');
let inventoryModel = require('../schemas/inventories');
let productModel = require('../schemas/products');

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
        let { shippingAddress, note } = req.body;

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
            totalAmount += item.product.price * item.quantity;
        }

        // Bước 3: Tạo Order trong transaction
        let newOrder = new orderModel({
            user: user._id,
            totalAmount: totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            status: 'pending',
            shippingAddress: shippingAddress || '',
            note: note || ''
        });
        await newOrder.save({ session });

        // Bước 4: Tạo OrderDetails và kiểm tra/trừ tồn kho
        for (let item of cart.products) {
            // Kiểm tra tồn kho
            let inventory = await inventoryModel.findOne({ product: item.product._id }).session(session);
            if (!inventory || inventory.stock < item.quantity) {
                await session.abortTransaction();
                await session.endSession();
                return res.status(400).send({
                    message: `Sản phẩm "${item.product.title}" không đủ số lượng trong kho`
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
        await session.endSession();

        res.send({
            message: 'Đặt hàng thành công',
            order: newOrder
        });

    } catch (error) {
        // Bất kỳ lỗi nào → Rollback toàn bộ
        await session.abortTransaction();
        await session.endSession();
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
        let order = await orderModel.findById(id).populate('user', 'username email');
        if (!order) {
            return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
        }

        let details = await orderDetailModel
            .find({ order: id })
            .populate('product', 'title price images');

        res.send({ order, details });
    } catch (error) {
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

        let order = await orderModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).send({ message: 'Không tìm thấy đơn hàng' });
        }

        res.send({ message: 'Cập nhật trạng thái thành công', order });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;
