const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id, isDeleted: false })
            .sort('-createdAt')
            .limit(50);

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
    } catch (error) {
        next(error);
    }
};
