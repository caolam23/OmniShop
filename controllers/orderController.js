const Notification = require('../models/Notification');

exports.mockCheckout = async (req, res, next) => {
    try {
        // Mock creating an order
        // 1. Create new notification
        const notification = new Notification({
            user: req.user._id,
            type: 'ORDER_STATUS',
            message: 'Đơn hàng giả lập của bạn đã được thanh toán thành công!'
        });
        await notification.save();

        // 2. Trigger Realtime notification event via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('new_notification', notification);
        }

        res.status(200).json({ success: true, message: 'Checkout successful (Mock)' });
    } catch (error) {
        next(error);
    }
};
