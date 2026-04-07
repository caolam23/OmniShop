var express = require('express');
var router = express.Router();
const Coupon = require('../models/Coupon');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// GET /api/v1/coupons - Lấy tất cả coupon (Admin)
router.get('/', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/v1/coupons - Tạo coupon mới (Admin)
router.post('/', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const coupon = new Coupon(req.body);
        await coupon.save();
        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// POST /api/v1/coupons/validate - Kiểm tra mã giảm giá (User)
router.post('/validate', verifyToken, async (req, res) => {
    try {
        const { code, orderValue } = req.body;
        const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });

        if (!coupon) return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
        if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
        if (orderValue < coupon.minOrderValue) return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString()}đ` });
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Mã giảm giá đã đạt giới hạn sử dụng' });

        const discount = coupon.discountType === 'percentage'
            ? (orderValue * coupon.discountValue) / 100
            : coupon.discountValue;

        res.json({ success: true, discount, coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/v1/coupons/:id - Cập nhật coupon (Admin)
router.put('/:id', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy coupon' });
        res.json({ success: true, data: coupon });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// DELETE /api/v1/coupons/:id - Xóa coupon (Admin)
router.delete('/:id', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy coupon' });
        res.json({ success: true, message: 'Đã xóa coupon thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
