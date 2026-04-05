const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required']
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required']
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1 star'],
            max: [5, 'Rating cannot exceed 5 stars']
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters']
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false
        }
    },
    {
        timestamps: true
    }
);

// Prevent user from submitting multiple reviews for the same product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
