// Ví dụ Products Controller - Cách implement chuẩn RESTful API

const Product = require('../models/Product'); // Giả sử có Product model
const { successResponse, errorResponse, getPagination } = require('../utils/responseHandler');

// @route   GET /api/v1/products
// @desc    Lấy danh sách products có phân trang
// @access  Public
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Phân trang
    const { skip, limit: pageLimit } = getPagination(page, limit);
    
    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    // Lấy tổng số products
    const total = await Product.countDocuments(query);
    
    // Lấy products của trang hiện tại
    const products = await Product.find(query)
      .skip(skip)
      .limit(pageLimit)
      .sort({ createdAt: -1 });
    
    // Response với pagination info
    return successResponse(res, {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    }, 'Products fetched successfully');
    
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/products/:id
// @desc    Lấy chi tiết 1 product
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }
    
    return successResponse(res, { product }, 'Product fetched successfully');
    
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/products
// @desc    Tạo product mới (chỉ admin)
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category } = req.body;
    
    // Validate input
    if (!name || !price || !stock) {
      return errorResponse(res, 'Name, price, and stock are required', 400);
    }
    
    // Tạo product
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
    });
    
    await product.save();
    
    return successResponse(res, { product }, 'Product created successfully', 201);
    
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/products/:id
// @desc    Cập nhật product (chỉ admin)
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;
    
    let product = await Product.findById(id);
    
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }
    
    // Update only provided fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (category) product.category = category;
    
    await product.save();
    
    return successResponse(res, { product }, 'Product updated successfully');
    
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/products/:id
// @desc    Xóa product (chỉ admin)
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return errorResponse(res, 'Product not found', 404);
    }
    
    return successResponse(res, { product }, 'Product deleted successfully');
    
  } catch (error) {
    next(error);
  }
};
