import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import styles from './UserProfile.module.css';

// Utility function to truncate long names
const truncateName = (name, maxLength = 20) => {
  if (!name) return '';
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
};

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage or fetch from API
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Đang tải...</div>;
  }

  if (!user) {
    return <div className={styles.errorContainer}>Không tìm thấy thông tin người dùng</div>;
  }

  const displayName = truncateName(user.fullName || user.name || user.email);

  return (
    <div className={styles.userProfileContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            OmniShop
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.welcomeCard}>
          {/* Greeting Section */}
          <div className={styles.greetingSection}>
            <h1 className={styles.greeting}>Xin chào, {displayName}! 👋</h1>
            <p className={styles.subGreeting}>Chào mừng bạn trở lại</p>
          </div>

          {/* User Info Section */}
          <div className={styles.userInfoSection}>
            <div className={styles.userAvatar}>
              <span className={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={styles.userDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Tên:</span>
                <span className={styles.value}>{user.fullName || user.name || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{user.email || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Vai trò:</span>
                <span className={styles.value}>{user.role?.name || user.role || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
