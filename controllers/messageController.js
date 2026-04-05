const Message = require('../models/Message');
const User = require('../models/User');
const Role = require('../models/Role');

// Get chat history between current user and another user
exports.getChatHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort('createdAt');

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

// Get available staff users for customer to chat with (prioritize Staff over Admin)
exports.getStaffForChat = async (req, res, next) => {
    try {
        // Prioritize Staff role first
        const staffRole = await Role.findOne({ name: 'Staff' });
        let staffUsers = [];

        if (staffRole) {
            staffUsers = await User.find({
                role: staffRole._id,
                _id: { $ne: req.user._id },
                isDeleted: { $ne: true }
            }).select('username email role').populate('role', 'name');
        }

        // If no Staff found, fallback to Admin
        if (staffUsers.length === 0) {
            const adminRole = await Role.findOne({ name: 'Admin' });
            if (adminRole) {
                staffUsers = await User.find({
                    role: adminRole._id,
                    _id: { $ne: req.user._id },
                    isDeleted: { $ne: true }
                }).select('username email role').populate('role', 'name');
            }
        }

        res.status(200).json({ success: true, data: staffUsers });
    } catch (error) {
        next(error);
    }
};

// Get list of ALL customer conversations (for any Staff/Admin to see and respond)
exports.getConversations = async (req, res, next) => {
    try {
        // Find the "User" role (customer)
        const userRole = await Role.findOne({ name: 'User' });
        if (!userRole) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Find all customers who have sent messages to ANY staff/admin
        const customerUsers = await User.find({ role: userRole._id, isDeleted: { $ne: true } })
            .select('_id');
        const customerIds = customerUsers.map(u => u._id);

        // Find all messages involving customers
        const messages = await Message.find({
            $or: [
                { sender: { $in: customerIds } },
                { receiver: { $in: customerIds } }
            ]
        }).sort('-createdAt');

        // Build conversation list grouped by customer
        const customerMap = new Map();
        for (const msg of messages) {
            const senderId = String(msg.sender);
            const receiverId = String(msg.receiver);

            // Determine which one is the customer
            const customerId = customerIds.some(id => String(id) === senderId)
                ? senderId
                : receiverId;

            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    partnerId: customerId,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unread: !msg.isRead && String(msg.receiver) !== customerId
                });
            }
        }

        // Get user info for each customer
        const partnerIds = [...customerMap.keys()];
        const users = await User.find({ _id: { $in: partnerIds } })
            .select('username email');

        const conversations = users.map(u => ({
            user: { _id: u._id, username: u.username, email: u.email },
            ...customerMap.get(String(u._id))
        }));

        // Sort by latest message
        conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        next(error);
    }
};
