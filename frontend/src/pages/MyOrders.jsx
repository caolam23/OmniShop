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
  
  // State phục vụ Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ shippingAddress: '', note: '' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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

  const handleCheckout = async () => {
    if (!checkoutData.shippingAddress.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }
    
    try {
      setCheckoutLoading(true);

      // Bước 1: Lấy 1 sản phẩm bất kỳ trong kho để làm mẫu (Vì team chưa làm trang Product/Cart)
      const productsRes = await fetch('http://localhost:3000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const productsData = await productsRes.json();
      const sampleProduct = productsData.data?.[0] || productsData[0];
      
      if (sampleProduct) {
        // Bước 2: Thêm tạm vào giỏ hàng
        await fetch('http://localhost:3000/api/v1/carts/add', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ product: sampleProduct._id, quantity: 1 })
        });
      }

      // BƯỚC 3: GỌI API CHECKOUT CỐT LÕI (YÊU CẦU ĐỒ ÁN)
      const response = await orderApi.checkout({
        shippingAddress: checkoutData.shippingAddress,
        note: checkoutData.note
      });

      // Xử lý thông báo thành công
      alert(`🎉 Đặt hàng thành công!\nMã đơn: ${response.order._id}`);
      setShowCheckout(false);
      setCheckoutData({ shippingAddress: '', note: '' });
      fetchMyOrders(); // Load lại lịch sử

    } catch (err) {
      // Xử lý thông báo thất bại
      alert(`❌ Lỗi đặt hàng: ${err?.message || 'Giỏ hàng trống hoặc thiếu hàng'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowCheckout(true)}
              style={{ background: '#4f46e5', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
              🛒 Đặt hàng mới (Test)
            </button>
            <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
              style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8',
                padding:'0.5rem 1rem', borderRadius:'8px', cursor:'pointer', fontSize:'0.875rem' }}>
              Đăng xuất
            </button>
          </div>
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

      {/* Modal Đặt hàng (Checkout) */}
      {showCheckout && (
        <div className={styles.modalOverlay} onClick={() => setShowCheckout(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tạo Đơn Hàng Mới</h2>
              <button className={styles.modalClose} onClick={() => setShowCheckout(false)}>×</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Địa chỉ giao hàng (*)</label>
              <input type="text" value={checkoutData.shippingAddress} 
                onChange={e => setCheckoutData({...checkoutData, shippingAddress: e.target.value})}
                placeholder="Nhập địa chỉ..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Ghi chú đơn hàng</label>
              <textarea value={checkoutData.note} 
                onChange={e => setCheckoutData({...checkoutData, note: e.target.value})}
                placeholder="Lời nhắn cho shipper..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }} />
            </div>
            <button onClick={handleCheckout} disabled={checkoutLoading}
              style={{ width: '100%', padding: '0.875rem', background: '#10b981', color: 'white', border: 'none',
                borderRadius: '8px', fontWeight: 600, cursor: checkoutLoading ? 'not-allowed' : 'pointer' }}>
              {checkoutLoading ? 'Đang xử lý Transaction...' : 'Xác nhận Đặt Hàng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
