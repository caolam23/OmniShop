const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { checkLogin } = require("../utils/authHandler");

// Tất cả các thao tác giỏ hàng đều yêu cầu người dùng đăng nhập
router.use(checkLogin);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateQuantity);
router.delete('/remove/:productId', cartController.removeFromCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;