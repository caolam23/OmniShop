const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required']
        },
        type: {
            type: String,
            required: [true, 'Notification type is required'],
            enum: ['ORDER_STATUS', 'SYSTEM_UPDATE', 'PROMOTION', 'NEW_MESSAGE']
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId, // Could be orderId, etc.
            default: null
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

module.exports = mongoose.model('Notification', notificationSchema);
