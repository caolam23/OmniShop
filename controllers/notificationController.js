const Notification = require('../models/Notification');

// @desc    Lấy danh sách thông báo của User (Phân trang)
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const skip = (pageNum - 1) * limitNum;

        // Lấy thông báo chưa xoá của user hiện tại
        const query = { user: req.user._id, isDeleted: false };

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Notification.countDocuments(query)
        ]);

        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Đánh dấu 1 thông báo là đã đọc
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or access denied',
            });
        }

        res.status(200).json({
            success: true,
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Đánh dấu TẤT CẢ thông báo là đã đọc
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false, isDeleted: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        next(error);
    }
};

// Utility func hỗ trợ call nội bộ từ backend controller (Vd: từ orderController)
// Tránh việc controller này phụ thuộc cứng vào controller khác.
exports.createAndEmitNotification = async (io, { userId, title, message, type, relatedId }) => {
    try {
        const notify = await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedId
        });

        if (io) {
            // Phát sự kiện tới socket Room mang tên Id user. Dùng socket id riêng rẽ
            io.to(userId.toString()).emit('new_notification', notify);
        }
        return notify;
    } catch (error) {
        console.error('Lỗi khi tạo Notification nội bộ:', error);
    }
};