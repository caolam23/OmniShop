const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, createReview);
router.get('/product/:productId', getProductReviews);

module.exports = router;
