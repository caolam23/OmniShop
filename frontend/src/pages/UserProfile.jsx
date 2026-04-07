import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, User as UserIcon, Package, LogOut } from 'lucide-react';
import NavBar from '../components/Navbar';
import orderApi from '../api/orderApi';
import styles from './UserProfile.module.css';

// =========================================================
// HELPER FUNCTIONS CHO ĐƠN HÀNG
// =========================================================
const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('vi-VN');

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

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // State điều hướng Tabs & Dữ liệu đơn hàng
  const [activeTab, setActiveTab] = useState(location.pathname === '/my-orders' ? 'orders' : 'profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Lắng nghe sự thay đổi của URL để cập nhật tab tương ứng
  useEffect(() => {
    if (location.pathname === '/my-orders') {
      setActiveTab('orders');
    } else if (location.pathname === '/user') {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Tải danh sách đơn hàng khi chuyển sang tab orders
  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const data = await orderApi.getMyOrders();
          setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, orders.length]);

  const handleViewDetail = async (orderId) => {
    try {
      const res = await orderApi.getOrderById(orderId);
      setSelectedOrder(res);
    } catch (err) {
      console.error('Không thể tải chi tiết', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
            {(user.role?.name === 'Staff' || user.role === 'Staff' || user.role?.name === 'Admin' || user.role === 'Admin') && (
              <a href="/support" className={styles.supportBtn}>
                <MessageCircle size={18} />
                Vào Support Panel
              </a>
            )}
            
            {/* Menu điều hướng Tabs */}
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => { setActiveTab('profile'); navigate('/user'); }}
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', background: activeTab === 'profile' ? '#eff6ff' : 'transparent', color: activeTab === 'profile' ? '#3b82f6' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, textAlign: 'left', transition: 'all 0.2s' }}
              >
                <UserIcon size={18} /> Hồ sơ cá nhân
              </button>
              <button
                onClick={() => { setActiveTab('orders'); navigate('/my-orders'); }}
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', background: activeTab === 'orders' ? '#eff6ff' : 'transparent', color: activeTab === 'orders' ? '#3b82f6' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, textAlign: 'left', transition: 'all 0.2s' }}
              >
                <Package size={18} /> Lịch sử đơn hàng
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', background: 'transparent', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, textAlign: 'left', marginTop: '1rem' }}
              >
                <LogOut size={18} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải: Hiển thị nội dung theo Tab được chọn */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'profile' && (
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
          )}

          {activeTab === 'orders' && (
            <div className={styles.card} style={{ padding: orders.length > 0 ? 0 : '2rem', overflow: 'hidden' }}>
              {loadingOrders ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Đang tải lịch sử đơn hàng...</div>
              ) : orders.length === 0 ? (
                <>
                  <h5 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Lịch sử đơn hàng</h5>
                  <div className={styles.emptyState} style={{ marginTop: '1rem' }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <p>Bạn chưa có đơn hàng nào trong hệ thống.</p>
                    <button className={styles.btnOutline} onClick={() => navigate('/shop')}>Khám phá sản phẩm ngay</button>
                  </div>
                </>
              ) : (
                <>
                  <h5 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>Lịch sử đơn hàng</h5>
                  <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                      <thead>
                        <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0', borderTop:'1px solid #e2e8f0' }}>
                          {['Mã đơn','Thành tiền','Trạng thái','Ngày đặt',''].map(h => (
                            <th key={h} style={{ padding:'0.875rem 1.5rem', textAlign:'left',
                              fontSize:'0.75rem', fontWeight:600, color:'#64748b',
                              textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, i) => (
                          <tr key={order._id}
                            style={{ borderBottom: i < orders.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                          >
                            <td style={{ padding:'1rem 1.5rem', fontFamily:'monospace', fontSize:'0.8rem', color:'#64748b' }}>
                              #{order._id.slice(-8).toUpperCase()}
                            </td>
                            <td style={{ padding:'1rem 1.5rem', fontWeight:700, color:'#16a34a' }}>
                              {formatMoney(order.finalAmount)}
                            </td>
                            <td style={{ padding:'1rem 1.5rem' }}>
                              <span style={{ display:'inline-block', padding:'0.25rem 0.625rem',
                                borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap',
                                ...STATUS_COLOR[order.status] }}>
                                {STATUS_LABEL[order.status]}
                              </span>
                            </td>
                            <td style={{ padding:'1rem 1.5rem', color:'#64748b', whiteSpace:'nowrap' }}>
                              {formatDate(order.createdAt)}
                            </td>
                            <td style={{ padding:'1rem 1.5rem', textAlign:'right' }}>
                              <button onClick={() => handleViewDetail(order._id)}
                                style={{ padding:'0.4rem 0.8rem', background:'#eef2ff', border:'1px solid #c7d2fe',
                                  borderRadius:'6px', color:'#4f46e5', fontSize:'0.8rem',
                                  cursor:'pointer', fontWeight:500, whiteSpace:'nowrap' }}>
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal hiển thị Chi tiết đơn hàng */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'16px', width:'600px', maxWidth:'95vw',
              maxHeight:'85vh', overflowY:'auto', padding:'2rem',
              boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, margin:0 }}>
                Đơn hàng #{selectedOrder.order._id.slice(-8).toUpperCase()}
              </h2>
              <button onClick={() => setSelectedOrder(null)}
                style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ background:'#f8fafc', padding:'1rem', borderRadius:'8px' }}>
                <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Trạng thái</div>
                <span style={{ display:'inline-block', padding:'0.25rem 0.625rem',
                  borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600,
                  ...STATUS_COLOR[selectedOrder.order.status] }}>
                  {STATUS_LABEL[selectedOrder.order.status]}
                </span>
              </div>
              <div style={{ background:'#f8fafc', padding:'1rem', borderRadius:'8px' }}>
                <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Thành tiền</div>
                <div style={{ fontWeight:700, color:'#16a34a', fontSize:'1.1rem' }}>{formatMoney(selectedOrder.order.finalAmount)}</div>
              </div>
              {selectedOrder.order.shippingAddress && (
                <div style={{ gridColumn:'1/-1', background:'#f8fafc', padding:'1rem', borderRadius:'8px' }}>
                  <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Địa chỉ giao hàng</div>
                  <div style={{ fontWeight:500 }}>{selectedOrder.order.shippingAddress}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#64748b', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Sản phẩm đã mua ({selectedOrder.details?.length || 0})
            </div>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 1rem' }}>
              {selectedOrder.details?.map((d, i) => (
                <div key={i} style={{ display:'flex', gap: '1rem', alignItems: 'center',
                  padding:'1rem 0', borderBottom: i < selectedOrder.details.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  {/* Cột 1: Ảnh sản phẩm */}
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                    <img 
                      src={d.product?.image ? `http://localhost:3000${d.product.image}` : '/placeholder.png'} 
                      alt="product" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/placeholder.png' }}
                    />
                  </div>
                  {/* Cột 2: Thông tin */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontWeight:600, color: '#333' }}>{d.product?.name || d.product?.title || 'Sản phẩm không xác định'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Đơn giá: {formatMoney(d.unitPrice)}</span>
                  </div>
                  {/* Cột 3: Số lượng và Tổng */}
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>x {d.quantity}</div>
                    <div style={{ color:'#16a34a', fontWeight:700 }}>{formatMoney(d.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Phần Tóm tắt Thanh toán (Breakdown) */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Tổng tiền hàng:</span>
                <span style={{ fontWeight: 600 }}>{formatMoney(selectedOrder.order.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Giảm giá khuyến mãi:</span>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>- {formatMoney(selectedOrder.order.discountAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '280px', fontSize: '1.1rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, color: '#333' }}>Thành tiền:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatMoney(selectedOrder.order.finalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}