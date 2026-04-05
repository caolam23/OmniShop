const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware'); // Middleware upload ảnh

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', upload.single('image'), productController.createProduct); // Bắt file 'image'
router.put('/:id', upload.single('image'), productController.updateProduct); // Cập nhật cũng có thể đổi ảnh
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/restore', productController.restoreProduct);

module.exports = router;