const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên danh mục là bắt buộc'],
    trim: true
  },
  description: {
    type: String
  },
  image: {
    type: String // Đường dẫn logo/hình ảnh danh mục
  },
  isDeleted: { type: Boolean, default: false, select: false }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);