// Ví dụ Products Routes - Cách dùng controllers chuẩn RESTful

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);      // GET /api/v1/products
router.get('/:id', productController.getProductById);   // GET /api/v1/products/:id

// Protected routes (required authentication)
router.post('/', authMiddleware, productController.createProduct);      // POST /api/v1/products
router.put('/:id', authMiddleware, productController.updateProduct);    // PUT /api/v1/products/:id
router.delete('/:id', authMiddleware, productController.deleteProduct); // DELETE /api/v1/products/:id

module.exports = router;
