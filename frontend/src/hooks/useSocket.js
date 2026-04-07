/**
 * hooks/useSocket.js
 * 
 * Custom hook tập trung mọi logic kết nối Socket.io.
 * 
 * @param {string|null} roomId - ID phòng cần join (null = không auto-join)
 * @param {function} onMessage - Callback nhận tin nhắn mới
 * @param {object|null} userInfo - { userId, role } - dùng để đăng ký presence (Customer)
 * @param {function|null} onPresence - Callback nhận presence event { type: 'online'|'offline', roomId, lastSeen? }
 * @returns {{ socketRef, isConnected, sendMessage }}
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
    : 'http://localhost:3000';

export function useSocket(roomId, onMessage, userInfo = null, onPresence = null, onNotification = null) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const onMessageRef = useRef(onMessage);
    const userInfoRef = useRef(userInfo);
    const onPresenceRef = useRef(onPresence);
    const onNotificationRef = useRef(onNotification);
    const registerTimerRef = useRef(null);

    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);
    useEffect(() => { onPresenceRef.current = onPresence; }, [onPresence]);
    useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);

    // Effect 1: Tạo socket MỘT LẦN DUY NHẤT
    // Tất cả event listeners (message, presence) đều đặt tại đây
    // để đảm bảo không bao giờ bị miss khi reconnect
    useEffect(() => {
        const sock = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            reconnectionDelay: 2000,
            reconnectionAttempts: 10,
        });
        socketRef.current = sock;

        sock.on('connect', () => {
            setIsConnected(true);
            console.log('✅ Socket connected:', sock.id);
        });

        // ✅ new_message listener đặt tại đây — không bị miss khi reconnect
        sock.on('new_message', (msg) => {
            if (typeof onMessageRef.current === 'function') {
                onMessageRef.current(msg);
            }
        });

        // ✅ new_notification listener
        sock.on('new_notification', (msg) => {
            if (typeof onNotificationRef.current === 'function') {
                onNotificationRef.current(msg);
            }
        });

        // ✅ Presence listeners đặt tại đây — không bị miss khi reconnect
        // (Trước đây đặt trong effect riêng phụ thuộc [isConnected] → miss event khi Staff socket reconnect)
        sock.on('user_online', ({ roomId: rId }) => {
            if (typeof onPresenceRef.current === 'function') {
                onPresenceRef.current({ type: 'online', roomId: rId });
            }
        });

        sock.on('user_offline', ({ roomId: rId, lastSeen }) => {
            if (typeof onPresenceRef.current === 'function') {
                onPresenceRef.current({ type: 'offline', roomId: rId, lastSeen });
            }
        });

        sock.on('disconnect', (reason) => {
            setIsConnected(false);
            console.log('❌ Socket disconnected:', reason);
        });

        return () => {
            clearTimeout(registerTimerRef.current);
            sock.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, []); // Mount một lần duy nhất

    // Effect 2: Join room khi roomId sẵn sàng (giải quyết async user load)
    useEffect(() => {
        if (!roomId || !socketRef.current) return;

        const joinRoom = () => {
            socketRef.current.emit('join_room', roomId);

            // Debounce 500ms để tránh spam register_user khi reconnect nhanh
            clearTimeout(registerTimerRef.current);
            registerTimerRef.current = setTimeout(() => {
                const info = userInfoRef.current;
                if (info?.userId && socketRef.current?.connected) {
                    socketRef.current.emit('register_user', {
                        roomId,
                        userId: info.userId,
                        role: info.role
                    });
                    console.log('👤 Registered user presence for room:', roomId);
                }
            }, 500);

            console.log(`👤 Joined room: ${roomId}`);
        };

        if (socketRef.current.connected) {
            joinRoom();
        } else {
            socketRef.current.once('connect', joinRoom);
        }

        return () => {
            clearTimeout(registerTimerRef.current);
            if (socketRef.current) {
                socketRef.current.emit('leave_room', roomId);
                socketRef.current.off('connect', joinRoom);
            }
        };
    }, [roomId]);

    const sendMessage = (data) => {
        return new Promise((resolve, reject) => {
            if (!socketRef.current?.connected) {
                reject(new Error('Chưa kết nối được tới server'));
                return;
            }
            socketRef.current.emit('chat_message', data, (ack) => {
                if (ack?.success) resolve(ack);
                else reject(new Error(ack?.error || 'Lỗi không xác định'));
            });
        });
    };

    return { socketRef, isConnected, sendMessage };
}
