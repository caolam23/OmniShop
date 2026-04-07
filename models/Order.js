let mongoose = require('mongoose')

let orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true
    },
    totalAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    discountAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    finalAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        type: String,
        default: ''
    },
    note: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('order', orderSchema)