const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên nhà cung cấp là bắt buộc'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  isDeleted: { type: Boolean, default: false, select: false }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);