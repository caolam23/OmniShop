const mongoose = require('mongoose');

const itemCartSchema = new mongoose.Schema({
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        min: 1
    }
}, {
    _id: false
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    products: {
        type: [itemCartSchema],
        default: []
    }
});

module.exports = mongoose.model('Cart', cartSchema);
