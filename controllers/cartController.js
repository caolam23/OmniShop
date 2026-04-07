const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Lấy giỏ hàng của người dùng hiện tại
// @route   GET /api/v1/carts
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('products.product');
    
    if (!cart) {
      // Tạo giỏ hàng mới nếu chưa có
      cart = await Cart.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm sản phẩm vào giỏ
// @route   POST /api/v1/carts/add
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    // 1. Kiểm tra sản phẩm và tồn kho
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Số lượng yêu cầu vượt quá tồn kho' });
    }

    // 2. Tìm hoặc khởi tạo giỏ hàng
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, products: [] });
    }

    // 3. Xử lý logic thêm/cập nhật
    const itemIndex = cart.products.findIndex(p => p.product.toString() === productId);

    if (itemIndex > -1) {
      // Nếu đã có, kiểm tra tổng số lượng mới có vượt tồn kho không
      const newQuantity = cart.products[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ success: false, message: `Chỉ còn ${product.stock} sản phẩm trong kho` });
      }
      cart.products[itemIndex].quantity = newQuantity;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('products.product');
    res.status(200).json({ success: true, data: updatedCart });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật số lượng sản phẩm
// @route   PUT /api/v1/carts/update
exports.updateQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity <= 0) return exports.removeFromCart(req, res, next);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Sản phẩm không đủ số lượng trong kho' });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id, "products.product": productId },
      { $set: { "products.$.quantity": quantity } },
      { new: true }
    ).populate('products.product');

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng' });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa sản phẩm khỏi giỏ
// @route   DELETE /api/v1/carts/remove/:productId
exports.removeFromCart = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate('products.product');

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Làm trống giỏ hàng
// @route   DELETE /api/v1/carts/clear
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { products: [] } },
      { new: true }
    );
    res.status(200).json({ success: true, data: cart, message: 'Đã xóa sạch giỏ hàng' });
  } catch (error) {
    next(error);
  }
};