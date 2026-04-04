// Ví dụ Products Routes - Cách dùng controllers chuẩn RESTful

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);      // GET /api/v1/products
router.get('/:id', productController.getProductById);   // GET /api/v1/products/:id

// Admin only routes (required Admin role)
router.post('/', verifyToken, checkRole(['Admin']), productController.createProduct);      // POST /api/v1/products
router.put('/:id', verifyToken, checkRole(['Admin']), productController.updateProduct);    // PUT /api/v1/products/:id
router.delete('/:id', verifyToken, checkRole(['Admin']), productController.deleteProduct); // DELETE /api/v1/products/:id

module.exports = router;
