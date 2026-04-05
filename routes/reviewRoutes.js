const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Use standard auth middleware
router.post('/', verifyToken, reviewController.createReview);
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;
