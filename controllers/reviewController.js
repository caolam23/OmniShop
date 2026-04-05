const Review = require('../models/Review');
const Product = require('../schemas/products'); // fallback to schema if model missing

exports.createReview = async (req, res, next) => {
    try {
        const { productId, rating, comment } = req.body;

        if (!productId || !rating) {
            return res.status(400).json({ success: false, message: 'Product ID and rating are required' });
        }

        const review = new Review({
            user: req.user._id,
            product: productId,
            rating,
            comment
        });

        await review.save();

        // Populate user info for realtime broadcast
        const populatedReview = await Review.findById(review._id).populate('user', 'username');

        // Broadcast new review to all clients via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('new_review', populatedReview);
        }

        res.status(201).json({ success: true, message: 'Review added successfully', data: populatedReview });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }
        next(error);
    }
};

exports.getProductReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ product: req.params.productId, isDeleted: false })
            .populate('user', 'username')
            .sort('-createdAt');

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        next(error);
    }
};
