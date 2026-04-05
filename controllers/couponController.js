const Coupon = require('../models/Coupon');

// @desc    Lấy tất cả mã giảm giá (Admin)
// @route   GET /api/v1/coupons
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo mã giảm giá mới
// @route   POST /api/v1/coupons
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật mã giảm giá
// @route   PUT /api/v1/coupons/:id
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa mã giảm giá
// @route   DELETE /api/v1/coupons/:id
exports.deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Đã xóa mã giảm giá' });
  } catch (error) {
    next(error);
  }
};

// @desc    Kiểm tra và áp dụng mã giảm giá
// @route   POST /api/v1/coupons/validate
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
    }

    // Kiểm tra hạn sử dụng
    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã quá hạn' });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Mã này chỉ áp dụng cho đơn hàng từ ${new Intl.NumberFormat('vi-VN').format(coupon.minOrderValue)}đ` 
      });
    }

    // Kiểm tra giới hạn lượt dùng
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    next(error);
  }
};