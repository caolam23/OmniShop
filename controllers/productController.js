const Product = require('../models/Product');


exports.getAllProducts = async (req, res, next) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const category = req.query.category;
    const supplier = req.query.supplier;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    const query = {};
    
    if (!includeDeleted) {
      query.isDeleted = { $ne: true };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }
    if (supplier) {
      query.supplier = supplier;
    }
    
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder };
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select('+isDeleted') 
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.restoreProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ success: true, message: 'Đã khôi phục sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};


exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name');
      
    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};


exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, supplier } = req.body;
    let imagePath = '';
    
    if (req.file) {
      imagePath = `/uploads/products/${req.file.filename}`;
    }
    
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      supplier,
      image: imagePath || req.body.image 
    });
    
    await product.save();
    res.status(201).json({ success: true, data: product, message: 'Tạo sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ success: true, data: product, message: 'Cập nhật thành công' });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};
