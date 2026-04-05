const Category = require('../models/Category');

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isDeleted: { $ne: true } });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category || category.isDeleted) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại hoặc đã bị xóa' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};


exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = { ...req.body };
    
    if (req.file) {
      categoryData.image = `/uploads/products/${req.file.filename}`; 
    }

    const category = new Category(categoryData);
    await category.save();
    res.status(201).json({ success: true, data: category, message: 'Tạo danh mục thành công' });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    res.status(200).json({ success: true, data: category, message: 'Cập nhật thành công' });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};