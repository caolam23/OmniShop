import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../api/socketClient';
import axiosClient from '../../api/axiosClient';
import styles from './AdminChatPanel.module.css';

const AdminChatPanel = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userRole = user?.role?.name || user?.role;

    // Only show for Staff/Admin
    const isStaff = userRole === 'Admin' || userRole === 'Staff' || userRole === 'Moderator';

    // Load customer conversation list
    useEffect(() => {
        if (user && isOpen && isStaff) {
            axiosClient.get('/messages/conversations')
                .then(res => setConversations(res.data || []))
                .catch(err => console.error('Error fetching conversations:', err));
        }
    }, [isOpen, user]);

    // Fetch chat history when selecting a customer
    useEffect(() => {
        if (selectedUser) {
            axiosClient.get(`/messages/${selectedUser._id}`)
                .then(res => setMessages(res.data || []))
                .catch(err => console.error('Error fetching messages:', err));
        }
    }, [selectedUser]);

    // Listen for ALL incoming messages to catch customer conversations
    useEffect(() => {
        if (!user || !isStaff) return;

        const handleReceiveMessage = (msg) => {
            // Always refresh conversation list when any message arrives
            axiosClient.get('/messages/conversations')
                .then(res => setConversations(res.data || []))
                .catch(() => { });

            // If currently viewing a customer chat, add the message to the view
            if (selectedUser) {
                const senderId = String(msg.sender?._id || msg.sender);
                const receiverId = String(msg.receiver?._id || msg.receiver);
                const selectedId = String(selectedUser._id);

                if (senderId === selectedId || receiverId === selectedId) {
                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => String(m._id) === String(msg._id))) return prev;
                        return [...prev, msg];
                    });
                }
            }
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => socket.off('receive_message', handleReceiveMessage);
    }, [user, selectedUser, isStaff]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !user || !selectedUser) return;

        const data = {
            senderId: user.id || user._id,
            receiverId: selectedUser._id,
            content: input,
        };

        socket.emit('chat_message', data);
        setInput('');
    };

    if (!user || !isStaff) return null;

    return (
        <div className={styles.chatContainer}>
            {isOpen ? (
                <div className={styles.chatWindow}>
                    <div className={styles.header}>
                        <h4>🎧 Trung tâm Hỗ trợ Khách hàng</h4>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>&times;</button>
                    </div>
                    <div className={styles.mainArea}>
                        {/* Customer List */}
                        <div className={styles.sidebar}>
                            <div className={styles.sidebarTitle}>Khách hàng</div>
                            {conversations.length === 0 ? (
                                <div className={styles.emptyList}>Chưa có cuộc hội thoại nào</div>
                            ) : (
                                conversations.map((conv) => (
                                    <div
                                        key={conv.partnerId}
                                        className={`${styles.convItem} ${selectedUser?._id === conv.user._id ? styles.convActive : ''}`}
                                        onClick={() => setSelectedUser(conv.user)}
                                    >
                                        <div className={styles.convAvatar}>
                                            {conv.user.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className={styles.convInfo}>
                                            <div className={styles.convName}>{conv.user.username}</div>
                                            <div className={styles.convLast}>{conv.lastMessage?.substring(0, 30)}...</div>
                                        </div>
                                        {conv.unread && <div className={styles.unreadDot} />}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Chat Area */}
                        <div className={styles.chatArea}>
                            {selectedUser ? (
                                <>
                                    <div className={styles.chatHeader}>
                                        Đang chat với: <strong>{selectedUser.username}</strong>
                                    </div>
                                    <div className={styles.body}>
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
                                            placeholder="Trả lời khách hàng..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            className={styles.input}
                                        />
                                        <button type="submit" className={styles.sendBtn}>Gửi</button>
                                    </form>
                                </>
                            ) : (
                                <div className={styles.noSelection}>
                                    <span style={{ fontSize: '48px' }}>💬</span>
                                    <p>Chọn một khách hàng từ danh sách bên trái để bắt đầu trả lời</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <button className={styles.toggleBtn} onClick={() => setIsOpen(true)}>
                    🎧 Hỗ trợ Khách hàng
                </button>
            )}
        </div>
    );
};

export default AdminChatPanel;
