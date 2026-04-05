const Supplier = require('../models/Supplier');

// Lấy tất cả nhà cung cấp (chưa bị xóa)
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isDeleted: { $ne: true } });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || supplier.isDeleted) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// Tạo mới
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json({ success: true, data: supplier, message: 'Tạo nhà cung cấp thành công' });
  } catch (error) {
    next(error);
  }
};

// Cập nhật
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại' });
    }
    res.status(200).json({ success: true, data: supplier, message: 'Cập nhật thành công' });
  } catch (error) {
    next(error);
  }
};

// Xóa mềm (Soft Delete)
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Nhà cung cấp không tồn tại' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa nhà cung cấp thành công' });
  } catch (error) {
    next(error);
  }
};