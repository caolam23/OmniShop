import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderApi from '../api/orderApi';
import styles from './OrderManagement.module.css';

const STATUS_BADGE = {
  pending:   styles.badgePending,
  confirmed: styles.badgeConfirmed,
  shipping:  styles.badgeShipping,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

const STATUS_LABEL = {
  pending:   'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping:  'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selected, setSelected] = useState(null); // { order, details }

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Lỗi khi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const res = await orderApi.getOrderById(orderId);
      setSelected(res);
    } catch (err) {
      setError(err?.message || 'Không thể tải chi tiết');
    }
  };

  const formatMoney = (amount) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('vi-VN');

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          OmniShop
        </div>
        <ul className={styles.navMenu}>
          <li>
            <a href="/dashboard" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/my-orders" className={`${styles.navItem} ${styles.navItemActive}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Đơn hàng của tôi
            </a>
          </li>
        </ul>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Đơn hàng của tôi</h1>
            <p className={styles.pageSubtitle}>Lịch sử mua hàng</p>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
            style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8',
              padding:'0.5rem 1rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.875rem' }}>
            Đăng xuất
          </button>
        </div>

        {error   && <div className={`${styles.alert} ${styles.alertError}`}>{error}</div>}
        {loading && <div className={`${styles.alert} ${styles.alertInfo}`}>Đang tải...</div>}

        {!loading && orders.length === 0 && (
          <div className={styles.emptyState}>
            <p>📭 Bạn chưa có đơn hàng nào</p>
            <a href="/products" style={{ color:'#6366f1' }}>Mua sắm ngay →</a>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Thành tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</td>
                    <td style={{ color: '#4ade80', fontWeight: 600 }}>
                      {formatMoney(order.finalAmount)}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <button className={styles.btnDetail} onClick={() => handleViewDetail(order._id)}>
                        Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal chi tiết */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Đơn hàng #{selected.order._id.slice(-8).toUpperCase()}
              </h2>
              <button className={styles.modalClose} onClick={() => setSelected(null)}>×</button>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Trạng thái</span>
                <span className={`${styles.badge} ${STATUS_BADGE[selected.order.status]}`}>
                  {STATUS_LABEL[selected.order.status]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Thành tiền</span>
                <span className={styles.infoValue} style={{ color: '#4ade80' }}>
                  {formatMoney(selected.order.finalAmount)}
                </span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.infoLabel}>Địa chỉ giao hàng</span>
                <span className={styles.infoValue}>{selected.order.shippingAddress || '—'}</span>
              </div>
            </div>

            <p className={styles.detailsTitle}>
              Sản phẩm ({selected.details?.length || 0})
            </p>
            {selected.details?.map((d, i) => (
              <div key={i} className={styles.detailRow}>
                <span className={styles.detailName}>{d.product?.title}</span>
                <div className={styles.detailRight}>
                  <span>{formatMoney(d.unitPrice)} × {d.quantity}</span>
                  <span className={styles.detailSubtotal}>{formatMoney(d.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
