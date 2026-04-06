import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import messageApi from '../../api/messageApi';
import styles from './ChatBox.module.css';

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [user, setUser] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    // Lấy thông tin user - re-run mỗi khi đổi trang
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { setUser(JSON.parse(userStr)); }
            catch (_) { setUser(null); }
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    const roomId = user?._id || user?.id;
    const roleName = user?.role?.name || user?.role;
    const isCustomer = !!user && roleName !== 'Admin' && roleName !== 'Staff';

    // Nhận tin nhắn realtime qua custom hook
    const { isConnected, sendMessage } = useSocket(
        isCustomer ? roomId : null,
        (msg) => setMessages((prev) => [...prev, msg]),
        isCustomer ? { userId: roomId, role: 'Customer' } : null
    );

    // Tải lịch sử chat khi mở chatbox lần đầu
    useEffect(() => {
        if (!isCustomer || !roomId) return;
        messageApi.getMessagesByRoom(roomId)
            .then((res) => { if (res.success) setMessages(res.data); })
            .catch(() => { }); // Lỗi tải lịch sử không block UX
    }, [roomId, isCustomer]);

    // Cuộn xuống tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Ẩn đối với Admin/Staff hoặc chưa đăng nhập
    if (!isCustomer) return null;

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || isSending) return;
        setIsSending(true);
        setInputValue('');
        try {
            await sendMessage({ room: roomId, sender: roomId, content: trimmed });
        } catch {
            // Nếu socket thất bại, hiển thị lại nội dung trong input
            setInputValue(trimmed);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={styles.chatContainer}>
            {isOpen ? (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.headerInfo}>
                            <span className={styles.onlineDot} style={{ background: isConnected ? '#22c55e' : '#ef4444' }} />
                            <span>OmniShop Support</span>
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.chatBody}>
                        {messages.length === 0 && (
                            <p style={{ color: '#9ca3af', textAlign: 'center', fontSize: '14px', marginTop: '20px' }}>
                                Chào bạn! 👋 Chúng tôi có thể giúp gì cho bạn?
                            </p>
                        )}
                        {messages.map((msg, i) => {
                            const senderId = msg.sender?._id || msg.sender;
                            const isMe = senderId === roomId;
                            return (
                                <div key={msg._id || i} className={`${styles.messageRow} ${isMe ? styles.messageCustomer : styles.messageStaff}`}>
                                    <div className={`${styles.bubble} ${isMe ? styles.bubbleCustomer : styles.bubbleStaff}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.chatFooter}>
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn... (Enter để gửi)"
                            className={styles.chatInput}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            autoFocus
                            disabled={isSending}
                        />
                        <button className={styles.sendBtn} onClick={handleSend} disabled={!inputValue.trim() || isSending}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                <button className={styles.chatToggleBtn} onClick={() => setIsOpen(true)}>
                    <MessageCircle size={28} />
                </button>
            )}
        </div>
    );
}
