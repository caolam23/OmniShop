const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
        },
        type: {
            type: String,
            enum: ['ORDER_STATUS', 'NEW_ORDER', 'SYSTEM_ALERT', 'GENERAL'],
            default: 'GENERAL',
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId, // Có thể trỏ tới Order ID
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index to automatically optimize query pulling unread notifications for a specific user
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
