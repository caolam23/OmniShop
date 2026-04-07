const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    min: 1,
    required: true,
  },
  unitPrice: {
    type: Number,
    min: 0,
    required: true,
  },
  subtotal: {
    type: Number,
    min: 0,
    required: true,
  },
});

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
