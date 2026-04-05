import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/Navbar';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className={styles.pageContainer}>
      <NavBar />
      
      <div className={styles.profileWrapper}>
          {/* Cột trái: Avatar & Thông tin ngắn gọn */}
          <div className={styles.card} style={{ height: 'fit-content' }}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatar}>
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <h4 className={styles.userName}>{user.username}</h4>
              <p className={styles.userEmail}>{user.email}</p>
              <div>
                <span className={styles.roleBadge}>
                  {user.role?.name || user.role || 'Khách hàng'}
                </span>
              </div>
            </div>
          </div>

          {/* Cột phải: Chi tiết thông tin & Lịch sử */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Card Thông tin cá nhân */}
            <div className={styles.card}>
              <h5 className={styles.sectionTitle}>Thông tin cá nhân</h5>
              <form>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên hiển thị</label>
                  <input type="text" className={styles.formInput} value={user.username} readOnly />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Địa chỉ Email</label>
                  <input type="email" className={styles.formInput} value={user.email} readOnly />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mật khẩu</label>
                  <input type="password" className={styles.formInput} value="********" readOnly />
                </div>
                <button 
                  type="button" 
                  className={styles.btnPrimary}
                  onClick={() => alert('Tính năng cập nhật thông tin đang được phát triển!')}
                >
                  Cập nhật thông tin
                </button>
              </form>
            </div>

            {/* Card Lịch sử đơn hàng */}
            <div className={styles.card}>
              <h5 className={styles.sectionTitle}>Lịch sử đơn hàng</h5>
              <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>Bạn chưa có đơn hàng nào trong hệ thống.</p>
                <button className={styles.btnOutline} onClick={() => navigate('/shop')}>Khám phá sản phẩm ngay</button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}