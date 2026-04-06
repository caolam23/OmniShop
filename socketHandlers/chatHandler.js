/**
 * socketHandlers/chatHandler.js
 * 
 * Tách biệt toàn bộ logic chat ra khỏi server entry point (bin/www).
 * Nguyên tắc: bin/www chỉ tạo server + io, còn mọi handler đều đặt tại đây.
 */

const Message = require('../models/Message');

// Map socketId -> { roomId, userId } de track ai dang online
const connectedUsers = new Map();
// Map userId -> timer de debounce offline event
const offlineTimers = new Map();
// Map roomId -> ISO timestamp -- luu thoi diem offline THUC TE tren server
// Ton tai lau dai (khong reset khi Staff navigate) de check_presence tra ve dung lastSeen
const offlineSince = new Map();

/**
 * @param {import('socket.io').Server} io
 */
module.exports = function registerChatHandlers(io) {

    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('join_room', (roomId) => {
            if (!roomId) return;
            socket.join(roomId);
            console.log('Socket', socket.id, 'joined room:', roomId);
        });

        socket.on('leave_room', (roomId) => {
            if (!roomId) return;
            socket.leave(roomId);
            console.log('Socket', socket.id, 'left room:', roomId);

            // Neu socket nay la Khach hang da dang ky (connectedUsers) va roi chinh phong cua minh
            // (logout hoac navigate) → bat dau dem 3s truoc khi bao offline
            // Luu y: Staff khong bao gio co trong connectedUsers (bi loc trong register_user)
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo && userInfo.roomId === roomId) {
                connectedUsers.delete(socket.id);

                // Huy timer cu neu co (tranh bao offline kep)
                if (offlineTimers.has(userInfo.userId)) {
                    clearTimeout(offlineTimers.get(userInfo.userId));
                }

                const timer = setTimeout(() => {
                    offlineTimers.delete(userInfo.userId);
                    const lastSeen = new Date().toISOString();
                    offlineSince.set(roomId, lastSeen);
                    io.to(roomId).emit('user_offline', { userId: userInfo.userId, roomId, lastSeen });
                    console.log('Customer', userInfo.userId, 'OFFLINE after leave_room, lastSeen:', lastSeen);
                }, 3000);

                offlineTimers.set(userInfo.userId, timer);
                console.log('Pending offline (leave_room) for', userInfo.userId, 'in 3s...');
            }
        });

        /**
         * Khach hang dang ky danh tinh sau khi join room
         * data = { roomId, userId, role }
         */
        socket.on('register_user', ({ roomId, userId, role }) => {
            if (!roomId || !userId) return;
            if (role === 'Admin' || role === 'Staff') return;

            // Huy timer offline neu khach reconnect
            if (offlineTimers.has(userId)) {
                clearTimeout(offlineTimers.get(userId));
                offlineTimers.delete(userId);
                console.log('Cancelled pending offline for Customer', userId, '(reconnected)');
            }
            // Xoa lastSeen khi Khach online lai
            offlineSince.delete(roomId);

            connectedUsers.set(socket.id, { roomId, userId });
            io.to(roomId).emit('user_online', { userId, roomId });
            console.log('Customer', userId, 'is ONLINE in room:', roomId);
        });

        /**
         * Staff hoi trang thai hien tai cua Khach khi vao phong
         * Tra ve { isOnline, lastSeen } -- lastSeen lay tu offlineSince tren server
         */
        socket.on('check_presence', ({ roomId }, callback) => {
            // Kiem tra giao cua 2 dieu kien:
            // 1. Socket dang thuc su trong room (io.sockets.adapter)
            // 2. Socket do da register qua register_user (connectedUsers)
            const roomSocketIds = io.sockets.adapter.rooms.get(roomId);
            const isOnline = roomSocketIds
                ? [...roomSocketIds].some(
                    (sid) => connectedUsers.has(sid) && connectedUsers.get(sid).roomId === roomId
                )
                : false;
            // Tra ve lastSeen thuc te tu server -- ton tai lau dai, ke ca khi Staff navigate
            const lastSeen = isOnline ? null : (offlineSince.get(roomId) || null);
            console.log('check_presence for room', roomId, ':', isOnline ? 'ONLINE' : ('OFFLINE lastSeen=' + lastSeen));
            if (typeof callback === 'function') callback({ isOnline, lastSeen });
        });

        /**
         * Nhan va phat broadcast tin nhan
         * data = { room, sender, content }
         */
        socket.on('chat_message', async (data, callback) => {
            try {
                const { room, sender, content } = data;
                if (!room || !sender || !content?.trim()) {
                    if (typeof callback === 'function') {
                        callback({ success: false, error: 'Du lieu tin nhan khong hop le' });
                    }
                    return;
                }

                const newMessage = await Message.create({ room, sender, content: content.trim() });
                const populatedMessage = await newMessage.populate('sender', 'username role');
                io.to(room).emit('new_message', populatedMessage);

                if (typeof callback === 'function') {
                    callback({ success: true, messageId: newMessage._id });
                }
            } catch (error) {
                console.error('Socket chat_message error:', error);
                if (typeof callback === 'function') {
                    callback({ success: false, error: 'Loi server khi xu ly tin nhan' });
                }
            }
        });

        socket.on('disconnect', (reason) => {
            const userInfo = connectedUsers.get(socket.id);
            console.log('Socket', socket.id, 'disconnected. Reason:', reason);

            if (userInfo) {
                const { roomId, userId } = userInfo;
                connectedUsers.delete(socket.id);

                // Debounce 3 giay: neu Khach reconnect trong 3s thi huy timer, khong bao offline gia
                const timer = setTimeout(() => {
                    offlineTimers.delete(userId);
                    const lastSeen = new Date().toISOString();
                    // Luu timestamp offline thuc te vao offlineSince (key = roomId)
                    offlineSince.set(roomId, lastSeen);
                    io.to(roomId).emit('user_offline', { userId, roomId, lastSeen });
                    console.log('Customer', userId, 'went OFFLINE (confirmed after 3s)');
                }, 3000);

                offlineTimers.set(userId, timer);
                console.log('Pending offline for', userId, 'in 3s...');
            }
        });
    });

};
