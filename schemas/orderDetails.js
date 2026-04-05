let mongoose = require('mongoose')

let orderDetailSchema = mongoose.Schema({
    order: {
        type: mongoose.Types.ObjectId,
        ref: 'order',
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    },
    unitPrice: {
        type: Number,
        min: 0,
        required: true
    },
    subtotal: {
        type: Number,
        min: 0,
        required: true
    }
})

module.exports = mongoose.model('orderDetail', orderDetailSchema)
