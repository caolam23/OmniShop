const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get chat history for a specific room (customer's user ID)
// @route   GET /api/v1/messages/:room
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const { room } = req.params;

        const messages = await Message.find({ room })
            .populate('sender', 'username email role')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get list of rooms (for Staff panel)
// @route   GET /api/v1/messages/rooms/latest
// @access  Private/Staff
exports.getChatRooms = async (req, res, next) => {
    try {
        const rooms = await Message.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$room',
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        // Populate lastMessage sender
        const populatedRooms = await Message.populate(rooms, {
            path: 'lastMessage.sender',
            select: 'username email role'
        });

        // Populate room owner (customer) — _id là userId của Khách
        const roomsWithOwner = await Promise.all(
            populatedRooms.map(async (room) => {
                const owner = await User.findById(room._id).select('username email');
                return { ...room, roomOwner: owner };
            })
        );

        res.status(200).json({
            success: true,
            data: roomsWithOwner
        });
    } catch (error) {
        next(error);
    }
};

