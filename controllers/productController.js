const Product = require('../models/Product');

// @route   GET /api/v1/products
// @desc    Lấy danh sách products có phân trang, tìm kiếm, sắp xếp
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    // 1. Nhận query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const category = req.query.category;
    const supplier = req.query.supplier;
    
    // 2. Xây dựng Query tìm kiếm (chỉ lấy SP chưa bị xóa mềm)
    const query = { isDeleted: { $ne: true } };
    
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
    
    // 3. Tính toán phân trang và sắp xếp
    const skip = (page - 1) * limit;
    const sortObj = { [sortBy]: sortOrder };
    
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
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

// @route   GET /api/v1/products/:id
// @access  Public
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

// @route   POST /api/v1/products
// @desc    Tạo product mới (Có xử lý file ảnh)
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, supplier } = req.body;
    let imagePath = '';
    
    // Nếu có file upload từ multer
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
      image: imagePath || req.body.image // Ưu tiên file upload, sau đó là link ngoài (nếu có)
    });
    
    await product.save();
    res.status(201).json({ success: true, data: product, message: 'Tạo sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/products/:id
// @desc    Cập nhật product (Có xử lý file ảnh)
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // Nếu có upload ảnh mới thì cập nhật đường dẫn ảnh
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

// @route   DELETE /api/v1/products/:id
// @desc    Xóa mềm product
// @access  Private/Admin
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
