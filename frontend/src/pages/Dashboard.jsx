import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import axiosClient from '../api/axiosClient';
import ReviewForm from '../components/Review/ReviewForm';
import ReviewList from '../components/Review/ReviewList';
import NotificationBell from '../components/Notification/NotificationBell';
import ChatBox from '../components/ChatBox/ChatBox';
import AdminChatPanel from '../components/ChatBox/AdminChatPanel';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await authApi.getCurrentUser();
        if (response.success) {
          setUser(response.user);
        } else {
          setError(response.message || 'Failed to fetch user');
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg
            className={styles.brandSvg}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          OmniShop
        </div>
        <ul className={styles.navMenu}>
          <li>
            <a href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/users" className={styles.navItem} title="Chỉ quản trị viên">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Quản lý Users
            </a>
          </li>
          <li>
            <a href="#" className={styles.navItem} title="Chưa có sẵn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Sản phẩm & Kho
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Chào mừng bạn trở lại, hệ thống OmniShop Admin.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell />
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.alertError}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={styles.alertInfo}>
            Đang tải dữ liệu...
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && (
          <>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.card}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Tổng Người Dùng</span>
                  <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </div>
                <div className={styles.statValue}>1,234</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>↑ 12% so với tháng trước</div>
              </div>

              <div className={styles.card}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Sản Phẩm Trong Kho</span>
                  <div className={`${styles.statIcon} ${styles.iconOrange}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    </svg>
                  </div>
                </div>
                <div className={styles.statValue}>567</div>
                <div className={styles.statTrend}>Đang kinh doanh</div>
              </div>

              <div className={styles.card}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Tổng Đơn Hàng</span>
                  <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                </div>
                <div className={styles.statValue}>892</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>↑ 8.5% so với tuần trước</div>
              </div>

              <div className={styles.card}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Doanh Thu (Tháng)</span>
                  <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                </div>
                <div className={styles.statValue}>$45,234</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>↑ 23% so với tháng trước</div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className={styles.bottomGrid}>
              {/* User Info Card */}
              <div className={styles.card}>
                <h3 className={styles.sectionTitle}>Thông Tin Tài Khoản</h3>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tên hiển thị</span>
                  <span className={styles.infoValue}>{user?.username || 'Chưa cập nhật'}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email hệ thống</span>
                  <span className={styles.infoValue}>{user?.email || 'Chưa cập nhật'}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phân quyền (Role)</span>
                  <span className={styles.infoValue}>
                    <span className={styles.badge}>{user?.role?.name || 'No Role'}</span>
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Trạng thái</span>
                  <span className={`${styles.infoValue} ${styles.statusActive}`}>Đang hoạt động</span>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className={styles.card}>
                <h3 className={styles.sectionTitle}>Thao tác nhanh</h3>

                <a href="/users" className={styles.quickLinkItem}>
                  <div className={styles.linkLeft} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Quản lý Người dùng & Phân quyền
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>

                <a href="/products" className={styles.quickLinkItem}>
                  <div className={styles.linkLeft} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Cập nhật Sản phẩm & Danh mục
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>

                <a href="/orders" className={styles.quickLinkItem}>
                  <div className={styles.linkLeft} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    Duyệt đơn hàng (Transaction)
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>

                <a href="#" className={styles.quickLinkItem}>
                  <div className={styles.linkLeft} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Kênh Live Chat & Đánh giá
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>

            {/* Component Phase 4 Testing Area */}
            <div className={styles.card} style={{ marginTop: '24px' }}>
              <h3 className={styles.sectionTitle}>[TEST] Khu vực giả lập Phase 4 (Dành cho Thành viên 5)</h3>
              <p style={{ color: '#555', fontSize: '14px', marginBottom: '16px' }}>
                Đây là khu vực test NotificationRealtime và Form Đánh giá Sản phẩm. Sau khi bấm nút bên dưới, hãy nhìn lên quả chuông màu xám trên Menu Top!
              </p>

              <button
                onClick={async () => {
                  try {
                    await axiosClient.post('/orders/checkout');
                    alert('Đã gửi request Thanh toán thành công! Hãy đợi socket báo chuông trong 1s nhé...');
                  } catch (e) {
                    alert('Lỗi: ' + e.message);
                  }
                }}
                style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '24px', fontWeight: 'bold' }}
              >
                🛒 Đặt Hàng Mới (Kích Hoạt Notification Socket)
              </button>


              <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

              <h3 className={styles.sectionTitle}>Giả lập Form Chi tiết Sản phẩm</h3>
              <ReviewForm productId="662b6623e6b02e1234567890" />
              <ReviewList productId="662b6623e6b02e1234567890" />
            </div>
          </>
        )}
      </main>
      <ChatBox />
      <AdminChatPanel />
    </div>
  );
}