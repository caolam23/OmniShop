import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';
import userApi from '../api/userApi';
import productApi from '../api/productApi';
import orderApi from '../api/orderApi';
import AdminSidebar from '../components/AdminSidebar';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0
  });

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

    const fetchDashboardData = async () => {
      try {
        // Gọi đồng thời các API để lấy số liệu
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          userApi.getAllUsers().catch(() => ({ success: false, data: [] })),
          productApi.getAllProducts({ limit: 10000 }).catch(() => ({ success: false, data: [] })),
          orderApi.getAllOrders().catch(() => ({ success: false, data: [] }))
        ]);

        let totalUsers = 0;
        let totalProducts = 0;
        let totalOrders = 0;

        if (usersRes.success) {
          const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.users || []);
          totalUsers = usersList.length;
        }

        if (productsRes.success) {
          const productsList = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.products || []);
          // Đếm số lượng sản phẩm (mẫu/loại sản phẩm)
          totalProducts = productsList.length;
        }
        if (ordersRes && ordersRes.success !== false) {
          if (ordersRes.total !== undefined) {
            totalOrders = ordersRes.total;
          } else if (ordersRes.data && ordersRes.data.total !== undefined) {
            totalOrders = ordersRes.data.total;
          } else {
            const ordersList = Array.isArray(ordersRes) ? ordersRes : (ordersRes.orders || ordersRes.data?.orders || (Array.isArray(ordersRes.data) ? ordersRes.data : []));
            totalOrders = ordersList.length;
          }
        }

        setStats({ totalUsers, totalProducts, totalOrders });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };

    fetchUser();
    fetchDashboardData();
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
      <AdminSidebar />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Chào mừng bạn trở lại, hệ thống OmniShop Admin.</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
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
                <div className={styles.statValue}>{stats.totalUsers}</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>Cập nhật theo thời gian thực</div>
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
                <div className={styles.statValue}>{stats.totalProducts}</div>
                <div className={styles.statTrend}>Tổng tồn kho hiện tại</div>
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
                <div className={styles.statValue}>{stats.totalOrders}</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>Tổng đơn hệ thống</div>
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
          </>
        )}
      </main>
    </div>
  );
}