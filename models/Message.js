const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: [true, 'Room is required'] // Bằng với userId của Customer
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người gửi là bắt buộc']
    },
    content: {
        type: String,
        required: [true, 'Nội dung tin nhắn không được để trống'],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
