const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required']
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Receiver is required']
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters']
        },
        isRead: {
            type: Boolean,
            default: false
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

module.exports = mongoose.model('Message', messageSchema);
