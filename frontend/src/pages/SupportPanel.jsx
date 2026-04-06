import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import messageApi from '../api/messageApi';
import styles from './SupportPanel.module.css';

/**
 * Trả về chuỗi thời gian tương đối, vd: "vừa xong", "3 phút trước", "1 giờ trước"
 */
function formatLastSeen(isoString) {
    if (!isoString) return null;
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000); // seconds
    if (diff < 30) return 'vừa xong';
    if (diff < 60) return `${diff} giây trước`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    return `${days} ngày trước`;
}

export default function SupportPanel() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [user, setUser] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const activeRoomRef = useRef(null); // ref để socket handler đọc được room hiện tại
    const navigate = useNavigate();

    // Lấy thông tin Staff
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { setUser(JSON.parse(userStr)); }
            catch (_) { navigate('/login'); }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Tải danh sách phòng chat
    const fetchRooms = async () => {
        try {
            const res = await messageApi.getChatRooms();
            if (res.success) setRooms(res.data);
        } catch (err) {
            console.error('Lỗi tải danh sách phòng chat:', err);
        }
    };

    useEffect(() => {
        if (user) fetchRooms();
    }, [user]);

    const [customerPresence, setCustomerPresence] = useState({}); // roomId -> { online, lastSeen }

    // useSocket: Staff không tự join room ngay.
    // Presence events (user_online/user_offline) được xử lý trong hook qua onPresence callback
    // → không bao giờ miss event kể cả khi Staff socket tạm thời reconnect
    const { socketRef, isConnected, sendMessage } = useSocket(
        null,
        // onMessage
        (msg) => {
            if (activeRoomRef.current && msg.room === activeRoomRef.current._id) {
                setMessages((prev) => [...prev, msg]);
            }
            fetchRooms();
        },
        // userInfo (Staff không register presence)
        null,
        // onPresence: xử lý user_online / user_offline từ Khách hàng
        ({ type, roomId: rId, lastSeen }) => {
            if (type === 'online') {
                setCustomerPresence((prev) => ({ ...prev, [rId]: { online: true, lastSeen: null } }));
            } else {
                setCustomerPresence((prev) => ({ ...prev, [rId]: { online: false, lastSeen } }));
            }
        }
    );

    const presenceIntervalRef = useRef(null);

    // Staff chọn 1 phòng chat
    const handleSelectRoom = async (room) => {
        // Rời phòng cũ và dừng polling presence
        if (activeRoomRef.current && socketRef.current) {
            socketRef.current.emit('leave_room', activeRoomRef.current._id);
        }
        clearInterval(presenceIntervalRef.current);

        setActiveRoom(room);
        activeRoomRef.current = room;
        setMessages([]);

        if (socketRef.current) {
            socketRef.current.emit('join_room', room._id);

            // Hàm poll presence — dùng lại cho cả initial check và interval
            const pollPresence = () => {
                if (!socketRef.current?.connected) return;
                socketRef.current.emit('check_presence', { roomId: room._id }, ({ isOnline, lastSeen }) => {
                    setCustomerPresence((prev) => ({
                        ...prev,
                        [room._id]: {
                            online: isOnline,
                            // Uu tien: lastSeen tu server (chinh xac, khong bi reset khi navigate)
                            // Fallback: lastSeen tu push event truoc do
                            lastSeen: isOnline ? null : (lastSeen || prev[room._id]?.lastSeen || null)
                        }
                    }));
                });
            };

            // Check ngay khi mở phòng
            pollPresence();
            // Polling 5 giây để đảm bảo eventual consistency (phòng khi miss push event)
            presenceIntervalRef.current = setInterval(pollPresence, 5000);
        }

        // Tải lịch sử chat
        try {
            const res = await messageApi.getMessagesByRoom(room._id);
            if (res.success) setMessages(res.data);
        } catch (err) {
            console.error('Không tải được lịch sử chat:', err);
        }
    };

    // Dọn dẹp interval khi unmount
    useEffect(() => {
        return () => clearInterval(presenceIntervalRef.current);
    }, []);

    const handleSend = async () => {
        const trimmed = inputValue.trim();
        if (!trimmed || !activeRoom || isSending) return;

        setIsSending(true);
        setInputValue('');
        try {
            await sendMessage({
                room: activeRoom._id,
                sender: user._id || user.id,
                content: trimmed
            });
        } catch {
            setInputValue(trimmed); // Khôi phục nếu gửi lỗi
        } finally {
            setIsSending(false);
        }
    };

    const staffId = user?._id || user?.id;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>
                    <Users size={28} color="#4f46e5" />
                    Trung Tâm Hỗ Trợ Khách Hàng
                </h2>
                <Link
                    to={(() => { const r = user?.role?.name || user?.role; return r === 'Admin' ? '/dashboard' : '/user'; })()}
                    className={styles.backBtn}
                >
                    ← Trở về
                </Link>
            </div>

            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <MessageCircle size={16} />
                        Hội thoại ({rooms.length})
                    </div>
                    <div className={styles.roomList}>
                        {rooms.length === 0 ? (
                            <div style={{ padding: '40px 20px', color: '#9ca3af', textAlign: 'center', fontSize: '14px' }}>
                                <MessageCircle size={48} color="#f3f4f6" style={{ marginBottom: '12px' }} />
                                <p>Chưa có tin nhắn nào</p>
                            </div>
                        ) : (
                            rooms.map((room) => {
                                const isActive = activeRoom?._id === room._id;
                                // Uu tien ten chu phong (Khach hang) thay vi nguoi gui tin cuoi
                                const customerName = room.roomOwner?.username || room.lastMessage?.sender?.username || 'Khách hàng';
                                return (
                                    <div key={room._id} className={`${styles.roomItem} ${isActive ? styles.roomActive : ''}`} onClick={() => handleSelectRoom(room)}>
                                        <div className={styles.avatar}>{customerName.charAt(0).toUpperCase()}</div>
                                        <div className={styles.roomInfo}>
                                            <div className={styles.roomName}>{customerName}</div>
                                            <div className={styles.roomPreview}>{room.lastMessage?.content || '...'}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className={styles.chatArea}>
                    {activeRoom ? (
                        <>
                            <div className={styles.chatHeader}>
                                <div className={styles.avatar}><User size={18} /></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {rooms.find(r => r._id === activeRoom._id)?.roomOwner?.username
                                            || rooms.find(r => r._id === activeRoom._id)?.lastMessage?.sender?.username
                                            || 'Khách hàng'}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 400 }}>
                                        {(() => {
                                            const presence = customerPresence[activeRoom._id];
                                            if (!presence) return <span style={{ color: '#9ca3af' }}>Không có thông tin</span>;
                                            if (presence.online) return <span style={{ color: '#22c55e' }}>🟢 Đang online</span>;
                                            const ago = formatLastSeen(presence.lastSeen);
                                            return <span style={{ color: '#ef4444' }}>🔴 Offline{ago ? ` • ${ago}` : ''}</span>;
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.chatBody}>
                                {messages.map((msg, idx) => {
                                    const senderId = msg.sender?._id || msg.sender;
                                    const isStaff = senderId === staffId;
                                    // Thời gian tin nhắn
                                    const timeStr = msg.createdAt
                                        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                        : '';
                                    return (
                                        <div key={msg._id || idx} className={`${styles.messageRow} ${isStaff ? styles.messageStaff : styles.messageCustomer}`}>
                                            <div className={`${styles.msgWrapper} ${isStaff ? styles.msgWrapperStaff : styles.msgWrapperCustomer}`}>
                                                <div className={`${styles.bubble} ${isStaff ? styles.bubbleStaff : styles.bubbleCustomer}`} style={{ maxWidth: '100%' }}>
                                                    {msg.content}
                                                </div>
                                                {timeStr && <div className={styles.timestamp}>{timeStr}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className={styles.chatFooter}>
                                <div className={styles.chatInputWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Nhập phản hồi... (Enter để gửi)"
                                        className={styles.chatInput}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        autoFocus
                                        disabled={isSending || !socketRef.current?.connected}
                                    />
                                    <button className={styles.sendBtn} onClick={handleSend} disabled={!inputValue.trim() || isSending || !socketRef.current?.connected}>
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noChatSelected}>
                            <div className={styles.noChatBox}>
                                <MessageCircle size={56} color="#d1d5db" style={{ marginBottom: '16px' }} />
                                <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px' }}>Chưa chọn hội thoại</h3>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
                                    Chọn một khách hàng bên trái để bắt đầu hỗ trợ
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
