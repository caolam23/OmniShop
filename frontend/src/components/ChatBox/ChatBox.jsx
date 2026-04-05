import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../api/socketClient';
import axiosClient from '../../api/axiosClient';
import styles from './ChatBox.module.css';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [staffUser, setStaffUser] = useState(null);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const messagesEndRef = useRef(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userRole = user?.role?.name || user?.role;

    // Only show ChatBox for Customer/User role (Staff/Admin use AdminChatPanel)
    const isCustomer = userRole === 'User' || userRole === 'Customer';

    // Auto-find an available Staff/Admin to chat with
    useEffect(() => {
        if (user && isOpen && isCustomer && !staffUser) {
            setLoadingStaff(true);
            axiosClient.get('/messages/staff')
                .then(res => {
                    const staffList = res.data || [];
                    if (staffList.length > 0) {
                        setStaffUser(staffList[0]); // Pick first available staff
                    }
                })
                .catch(err => console.error('Error fetching staff:', err))
                .finally(() => setLoadingStaff(false));
        }
    }, [isOpen, user]);

    // Fetch chat history when staffUser is available
    useEffect(() => {
        if (user && isOpen && staffUser) {
            axiosClient.get(`/messages/${staffUser._id}`)
                .then(res => setMessages(res.data || []))
                .catch(err => console.error('Error fetching messages:', err));
        }
    }, [isOpen, staffUser]);

    // Listen for incoming messages
    useEffect(() => {
        if (!user || !staffUser) return;

        const handleReceiveMessage = (msg) => {
            const myId = String(user.id || user._id);
            const staffId = String(staffUser._id);
            const senderId = String(msg.sender?._id || msg.sender);
            const receiverId = String(msg.receiver?._id || msg.receiver);

            if (
                (senderId === myId && receiverId === staffId) ||
                (senderId === staffId && receiverId === myId)
            ) {
                setMessages((prev) => [...prev, msg]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => socket.off('receive_message', handleReceiveMessage);
    }, [user, staffUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !user || !staffUser) return;

        const data = {
            senderId: user.id || user._id,
            receiverId: staffUser._id,
            content: input,
        };

        socket.emit('chat_message', data);
        setInput('');
    };

    // Don't show for unauthenticated or Staff/Admin users
    if (!user || !isCustomer) return null;

    return (
        <div className={styles.chatContainer}>
            {isOpen ? (
                <div className={styles.chatWindow}>
                    <div className={styles.header}>
                        <h4>
                            {staffUser
                                ? `💬 Chat với ${staffUser.username} (Nhân viên)`
                                : 'Hỗ trợ trực tuyến'}
                        </h4>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className={styles.body}>
                        {loadingStaff && <div style={{ padding: '16px', color: '#999' }}>Đang tìm nhân viên hỗ trợ...</div>}
                        {!loadingStaff && !staffUser && (
                            <div style={{ padding: '16px', color: '#e74c3c' }}>
                                Hiện không có nhân viên hỗ trợ nào online. Vui lòng thử lại sau!
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`${styles.messageWrapper} ${String(msg.sender?._id || msg.sender) === String(user.id || user._id) ? styles.sent : styles.received}`}
                            >
                                <div className={styles.messageBubble}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={sendMessage} className={styles.footer}>
                        <input
                            type="text"
                            placeholder={staffUser ? "Nhập tin nhắn..." : "Đang chờ nhân viên..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className={styles.input}
                            disabled={!staffUser}
                        />
                        <button type="submit" className={styles.sendBtn} disabled={!staffUser}>Gửi</button>
                    </form>
                </div>
            ) : (
                <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
                    💬 Chat với Nhân viên
                </button>
            )}
        </div>
    );
};

export default ChatBox;
