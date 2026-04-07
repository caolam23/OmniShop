import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderApi from '../api/orderApi';
import AdminSidebar from '../components/AdminSidebar';
import styles from './Dashboard.module.css';

const STATUS_LABEL = {
  pending:   'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping:  'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLOR = {
  pending:   { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  confirmed: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  shipping:  { background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe' },
  delivered: { background: '#dcfce7', color: '#14532d', border: '1px solid #86efac' },
  cancelled: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
};

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('vi-VN');

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

  // Hàm Checkout: gọi API Transaction
  const handleCheckout = async () => {
    if (!checkoutData.shippingAddress.trim()) {
      alert('Vui lòng nhập địa chỉ giao hàng!');
      return;
    }

    try {
      setCheckoutLoading(true);
      const response = await orderApi.checkout({
        shippingAddress: checkoutData.shippingAddress,
        note: checkoutData.note
      });

      alert(`🎉 Đặt hàng thành công!\nMã đơn: ${response.order._id}`);
      setShowCheckout(false);
      setCheckoutData({ shippingAddress: '', note: '' });
      fetchMyOrders();

    } catch (err) {
      alert(`❌ Lỗi đặt hàng: ${err?.message || 'Giỏ hàng trống hoặc thiếu hàng'}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar dùng chung */}
      <AdminSidebar />

      {/* Main */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Đơn hàng của tôi</h1>
            <p className={styles.pageSubtitle}>Lịch sử mua hàng</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowCheckout(true)}
              style={{ background: '#4f46e5', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: 600 }}>
              🛒 Đặt hàng mới
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>

        {error   && <div className={styles.alertError}>{error}</div>}
        {loading && <div className={styles.alertInfo}>Đang tải...</div>}

        {!loading && orders.length === 0 && (
          <div className={styles.card} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
            <p>📭 Bạn chưa có đơn hàng nào</p>
            <a href="/shop" style={{ color:'#6366f1' }}>Mua sắm ngay →</a>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className={styles.card} style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                  {['Mã đơn','Thành tiền','Trạng thái','Ngày đặt','Chi tiết'].map(h => (
                    <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left',
                      fontSize:'0.75rem', fontWeight:600, color:'#64748b',
                      textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order._id}
                    style={{ borderBottom: i < orders.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}
                  >
                    <td style={{ padding:'0.875rem 1rem', fontFamily:'monospace',
                      fontSize:'0.8rem', color:'#64748b' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding:'0.875rem 1rem', fontWeight:700, color:'#16a34a' }}>
                      {formatMoney(order.finalAmount)}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <span style={{ display:'inline-block', padding:'0.25rem 0.625rem',
                        borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600,
                        ...STATUS_COLOR[order.status] }}>
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td style={{ padding:'0.875rem 1rem', color:'#64748b' }}>
                      {formatDate(order.createdAt)}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <button onClick={() => handleViewDetail(order._id)}
                        style={{ padding:'0.3rem 0.7rem', background:'#eef2ff', border:'1px solid #c7d2fe',
                          borderRadius:'6px', color:'#4f46e5', fontSize:'0.8rem',
                          cursor:'pointer', fontWeight:500 }}>
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

      {/* Modal Chi tiết */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'16px', width:'600px', maxWidth:'95vw',
              maxHeight:'85vh', overflowY:'auto', padding:'2rem',
              boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, margin:0 }}>
                Đơn hàng #{selected.order._id.slice(-8).toUpperCase()}
              </h2>
              <button onClick={() => setSelected(null)}
                style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ background:'#f8fafc', padding:'0.75rem', borderRadius:'8px' }}>
                <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Trạng thái</div>
                <span style={{ display:'inline-block', padding:'0.25rem 0.625rem',
                  borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600,
                  ...STATUS_COLOR[selected.order.status] }}>
                  {STATUS_LABEL[selected.order.status]}
                </span>
              </div>
              <div style={{ background:'#f8fafc', padding:'0.75rem', borderRadius:'8px' }}>
                <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Thành tiền</div>
                <div style={{ fontWeight:700, color:'#16a34a' }}>{formatMoney(selected.order.finalAmount)}</div>
              </div>
              {selected.order.shippingAddress && (
                <div style={{ gridColumn:'1/-1', background:'#f8fafc', padding:'0.75rem', borderRadius:'8px' }}>
                  <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Địa chỉ giao hàng</div>
                  <div style={{ fontWeight:500 }}>{selected.order.shippingAddress}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#64748b', marginBottom:'0.75rem' }}>
              Sản phẩm ({selected.details?.length || 0})
            </div>
            {selected.details?.map((d, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between',
                padding:'0.75rem 0', borderBottom: i < selected.details.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontWeight:500 }}>{d.product?.title || 'N/A'}</span>
                <div style={{ display:'flex', gap:'1rem', fontSize:'0.8rem', color:'#64748b' }}>
                  <span>{formatMoney(d.unitPrice)} × {d.quantity}</span>
                  <span style={{ color:'#16a34a', fontWeight:700 }}>{formatMoney(d.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Đặt hàng (Checkout) */}
      {showCheckout && (
        <div onClick={() => setShowCheckout(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'16px', width:'400px', maxWidth:'95vw',
              padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, margin:0 }}>Tạo Đơn Hàng Mới</h2>
              <button onClick={() => setShowCheckout(false)}
                style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#64748b', marginBottom:'0.25rem' }}>
                Địa chỉ giao hàng (*)
              </label>
              <input type="text" value={checkoutData.shippingAddress}
                onChange={e => setCheckoutData({...checkoutData, shippingAddress: e.target.value})}
                placeholder="Nhập địa chỉ..."
                style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #e2e8f0', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display:'block', fontSize:'0.85rem', color:'#64748b', marginBottom:'0.25rem' }}>
                Ghi chú đơn hàng
              </label>
              <textarea value={checkoutData.note}
                onChange={e => setCheckoutData({...checkoutData, note: e.target.value})}
                placeholder="Lời nhắn cho shipper..."
                style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', border:'1px solid #e2e8f0',
                  minHeight:'80px', resize:'vertical', boxSizing:'border-box' }} />
            </div>
            <button onClick={handleCheckout} disabled={checkoutLoading}
              style={{ width:'100%', padding:'0.875rem', background:'#10b981', color:'white',
                border:'none', borderRadius:'8px', fontWeight:600,
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                opacity: checkoutLoading ? 0.7 : 1 }}>
              {checkoutLoading ? 'Đang xử lý Transaction...' : 'Xác nhận Đặt Hàng'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
