import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import notificationApi from '../../api/notificationApi';
import styles from './NotificationDropdown.module.css';

export default function NotificationDropdown({ userId, latestNotification }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const containerRef = useRef(null);

    const fetchNotifications = async () => {
        if (!userId) {
            console.log("No userId, skipping fetch");
            return;
        }
        try {
            console.log("Fetching notifications for userId:", userId);
            const res = await notificationApi.getNotifications({ page: 1, limit: 15 });
            console.log("API response:", res);
            if (res.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông báo:', error);
        }
    };

    // Load khi mount
    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    // Nhận notify từ socket qua props
    useEffect(() => {
        if (latestNotification) {
            setNotifications(prev => [latestNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        }
    }, [latestNotification]);

    // Chặn click out
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return Math.floor(seconds) + " giây trước";
    };

    return (
        <div className={styles.dropdownContainer} ref={containerRef}>
            <button className={styles.bellBtn} onClick={() => setIsOpen(!isOpen)}>
                <Bell size={24} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.popover}>
                    <div className={styles.popoverHeader}>
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}>Chưa có thông báo nào.</div>
                    ) : (
                        <ul className={styles.notificationList}>
                            {notifications.map((notif) => (
                                <li
                                    key={notif._id}
                                    className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                                    onClick={() => handleMarkAsRead(notif._id, notif.isRead)}
                                >
                                    <div className={styles.itemHeader}>
                                        <h4 className={styles.itemTitle}>{notif.title}</h4>
                                        <span className={styles.itemTime}>{timeAgo(notif.createdAt)}</span>
                                    </div>
                                    <p className={styles.itemMessage}>{notif.message}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}