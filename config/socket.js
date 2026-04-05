const socketIo = require('socket.io');
const Message = require('../models/Message');

const configureSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id}`);

        // Listen for new chat messages
        socket.on('chat_message', async (data) => {
            try {
                const { senderId, receiverId, content } = data;

                // Save message to DB
                const newMessage = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content
                });
                await newMessage.save();

                // Broadcast to clients (you can refine this to specific rooms later)
                io.emit('receive_message', newMessage);
            } catch (error) {
                console.error('Socket message save error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = configureSocket;
