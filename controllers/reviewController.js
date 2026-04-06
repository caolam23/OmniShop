const Review = require('../models/Review');
const Product = require('../models/Product');

// @desc    Create new review
// @route   POST /api/v1/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        req.body.user = req.user.id; // Lấy user từ token

        // Kiểm tra Product có tồn tại không
        const product = await Product.findById(req.body.product);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // Tùy chọn: Kiểm tra xem user đã review sản phẩm này chưa
        const alreadyReviewed = await Review.findOne({
            product: req.body.product,
            user: req.user.id
        });

        if (alreadyReviewed) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
        }

        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for a product (with pagination)
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 5;
        const startIndex = (page - 1) * limit;

        const reviews = await Review.find({ product: req.params.productId, isDeleted: false })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        const total = await Review.countDocuments({ product: req.params.productId, isDeleted: false });

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};
