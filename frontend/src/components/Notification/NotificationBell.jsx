import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../../api/socketClient';
import axiosClient from '../../api/axiosClient';
import styles from './NotificationBell.module.css';

// Global flag - survives component remounts (React StrictMode, parent re-renders)
let _hasFetched = false;
let _cachedNotifications = [];

const NotificationBell = () => {
    const [notifications, setNotifications] = useState(_cachedNotifications);
    const [showDropdown, setShowDropdown] = useState(false);
    const [toast, setToast] = useState(null);
    const dropdownRef = useRef(null);
    const toastTimerRef = useRef(null);

    // Read userId once — never changes during session
    const userIdRef = useRef(null);
    if (userIdRef.current === null) {
        try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            userIdRef.current = u?.id || u?._id || '';
        } catch { userIdRef.current = ''; }
    }
    const userId = userIdRef.current;

    // Fetch notifications ONCE globally (survives StrictMode double-mount)
    useEffect(() => {
        if (!userId || _hasFetched) return;
        _hasFetched = true;

        axiosClient.get('/notifications')
            .then(res => {
                const data = res.data || [];
                _cachedNotifications = data;
                setNotifications(data);
            })
            .catch(err => console.error('Error fetching notifications:', err));
    }, []); // Empty deps — only on mount

    // Socket listener
    useEffect(() => {
        if (!userId) return;

        const handler = (notification) => {
            const notifUser = String(notification.user?._id || notification.user);
            if (notifUser === String(userId)) {
                setNotifications(prev => {
                    const updated = [notification, ...prev];
                    _cachedNotifications = updated;
                    return updated;
                });

                // Show toast popup
                setToast(notification);
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                toastTimerRef.current = setTimeout(() => setToast(null), 5000);
            }
        };

        socket.on('new_notification', handler);
        return () => socket.off('new_notification', handler);
    }, []); // Empty deps — socket listener is stable

    // Click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = useCallback(async (id) => {
        try {
            await axiosClient.patch(`/notifications/${id}/read`);
            setNotifications(prev => {
                const updated = prev.map(n => n._id === id ? { ...n, isRead: true } : n);
                _cachedNotifications = updated;
                return updated;
            });
        } catch (error) {
            console.error('Error marking as read', error);
        }
    }, []);

    if (!userId) return null;

    return (
        <>
            {/* Toast Popup */}
            {toast && (
                <div className={styles.toastOverlay}>
                    <div className={styles.toast}>
                        <div className={styles.toastIcon}>🔔</div>
                        <div className={styles.toastContent}>
                            <div className={styles.toastTitle}>Thông báo mới</div>
                            <div className={styles.toastMessage}>{toast.message}</div>
                        </div>
                        <button className={styles.toastClose} onClick={() => setToast(null)}>&times;</button>
                    </div>
                </div>
            )}

            {/* Bell Icon */}
            <div className={styles.bellContainer} ref={dropdownRef}>
                <button
                    className={styles.bellButton}
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-label="Notifications"
                >
                    🔔
                    {unreadCount > 0 && (
                        <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>

                {showDropdown && (
                    <div className={styles.dropdown}>
                        <div className={styles.header}>
                            <h4>Thông báo</h4>
                        </div>
                        <div className={styles.list}>
                            {notifications.length === 0 ? (
                                <div className={styles.empty}>Không có thông báo nào</div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`${styles.item} ${notif.isRead ? '' : styles.unread}`}
                                        onClick={() => markAsRead(notif._id)}
                                    >
                                        <p className={styles.message}>{notif.message}</p>
                                        <span className={styles.time}>
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default NotificationBell;
