const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Sản phẩm là bắt buộc']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người dùng là bắt buộc']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Vui lòng đánh giá số sao (1-5)']
    },
    comment: {
        type: String,
        required: [true, 'Vui lòng nhập nội dung đánh giá'],
        trim: true,
        maxlength: [500, 'Nội dung quá dài']
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, { timestamps: true });

// Tự động tính trung bình sao
reviewSchema.statics.calcAverageRatings = async function (productId) {
    const stats = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            reviewCount: stats[0].nRating,
            averageRating: Math.round(stats[0].avgRating * 10) / 10
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            reviewCount: 0,
            averageRating: 0
        });
    }
};

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.product);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.product);
    }
});

module.exports = mongoose.model('Review', reviewSchema);
