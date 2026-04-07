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

export default function OrderManagement() {
  const navigate = useNavigate();

  const [orders, setOrders]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage]             = useState(1);
  const LIMIT = 10;

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exporting, setExporting]         = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: LIMIT };
      if (filterStatus) params.status = filterStatus;
      const res = await orderApi.getAllOrders(params);
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err?.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      setSuccessMsg('Cập nhật trạng thái thành công!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchOrders();
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại');
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const res = await orderApi.getOrderById(orderId);
      setSelectedOrder(res);
    } catch (err) {
      setError(err?.message || 'Không thể tải chi tiết đơn hàng');
    }
  };

  const handleExportInvoice = async (orderId) => {
    try {
      const blob = await orderApi.exportInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hoa-don-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Xuất hóa đơn thất bại: ' + (err?.message || ''));
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const blob = await orderApi.exportExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `don-hang-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Xuất file thất bại: ' + (err?.message || ''));
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar từ component dùng chung của team */}
      <AdminSidebar />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Quản lý Đơn hàng</h1>
            <p className={styles.pageSubtitle}>Tổng: {total} đơn hàng trong hệ thống</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              style={{ display:'flex', alignItems:'center', gap:'0.5rem',
                padding:'0.5rem 1rem', background:'#16a34a', border:'none', borderRadius:'8px',
                color:'white', fontSize:'0.875rem', fontWeight:'500', cursor:'pointer' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exporting ? 'Đang xuất...' : 'Xuất Excel'}
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error      && <div className={styles.alertError}>{error}</div>}
        {successMsg && (
          <div style={{ background:'#dcfce7', border:'1px solid #86efac', color:'#14532d',
            padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem' }}>
            {successMsg}
          </div>
        )}

        {/* Filter */}
        <div style={{ marginBottom:'1.25rem' }}>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            style={{ padding:'0.5rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'8px',
              fontSize:'0.875rem', color:'#374151', background:'white', cursor:'pointer' }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao</option>
            <option value="delivered">Đã giao</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.alertInfo}>Đang tải dữ liệu...</div>
        ) : orders.length === 0 ? (
          <div className={styles.card} style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
            📭 Không có đơn hàng nào
          </div>
        ) : (
          <div className={styles.card} style={{ padding:0, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                  {['Mã đơn hàng','Khách hàng','Thành tiền','Trạng thái','Ngày đặt','Thao tác'].map(h => (
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
                    style={{ borderBottom: i < orders.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}
                  >
                    <td style={{ padding:'0.875rem 1rem', fontFamily:'monospace',
                      fontSize:'0.8rem', color:'#64748b' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding:'0.875rem 1rem' }}>
                      <div style={{ fontWeight:600, color:'#0f172a' }}>{order.user?.username || 'N/A'}</div>
                      <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{order.user?.email}</div>
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
                      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order._id, e.target.value)}
                          style={{ padding:'0.3rem 0.5rem', border:'1px solid #e2e8f0',
                            borderRadius:'6px', fontSize:'0.8rem', cursor:'pointer', background:'white' }}
                        >
                          <option value="pending">Chờ xác nhận</option>
                          <option value="confirmed">Đã xác nhận</option>
                          <option value="shipping">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                        <button
                          onClick={() => handleViewDetail(order._id)}
                          style={{ padding:'0.3rem 0.7rem', background:'#eef2ff', border:'1px solid #c7d2fe',
                            borderRadius:'6px', color:'#4f46e5', fontSize:'0.8rem',
                            cursor:'pointer', fontWeight:500 }}
                        >
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginTop:'1.25rem' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              style={{ padding:'0.4rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'6px',
                background:'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding:'0.4rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'6px',
                  fontWeight: p === page ? 600 : 400, cursor:'pointer',
                  background: p === page ? '#4f46e5' : 'white',
                  color: p === page ? 'white' : '#374151' }}>
                {p}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding:'0.4rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'6px',
                background:'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1 }}>
              Sau →
            </button>
          </div>
        )}
      </main>

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'16px', width:'640px', maxWidth:'95vw',
              maxHeight:'85vh', overflowY:'auto', padding:'2rem',
              boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'#0f172a', margin:0 }}>
                Chi tiết đơn #{selectedOrder.order._id.slice(-8).toUpperCase()}
              </h2>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <button onClick={() => handleExportInvoice(selectedOrder.order._id)}
                  style={{ padding:'0.4rem 0.75rem', background:'#3b82f6', border:'none', borderRadius:'6px',
                    color:'white', fontSize:'0.8rem', cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:'0.3rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Tải hóa đơn
                </button>
                <button onClick={() => setSelectedOrder(null)}
                  style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'#94a3b8', lineHeight:1 }}>×</button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Khách hàng', value: selectedOrder.order.user?.username },
                { label:'Trạng thái', value:
                  <span style={{ display:'inline-block', padding:'0.25rem 0.625rem',
                    borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600,
                    ...STATUS_COLOR[selectedOrder.order.status] }}>
                    {STATUS_LABEL[selectedOrder.order.status]}
                  </span>
                },
                { label:'Tổng tiền hàng', value: formatMoney(selectedOrder.order.totalAmount) },
                { label:'Thành tiền', value: <span style={{ color:'#16a34a', fontWeight:700 }}>{formatMoney(selectedOrder.order.finalAmount)}</span> },
              ].map(({ label, value }) => (
                <div key={label} style={{ background:'#f8fafc', padding:'0.75rem', borderRadius:'8px' }}>
                  <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>{label}</div>
                  <div style={{ fontWeight:600, color:'#0f172a' }}>{value}</div>
                </div>
              ))}
              {selectedOrder.order.shippingAddress && (
                <div style={{ gridColumn:'1/-1', background:'#f8fafc', padding:'0.75rem', borderRadius:'8px' }}>
                  <div style={{ fontSize:'0.75rem', color:'#64748b', marginBottom:'0.25rem' }}>Địa chỉ giao hàng</div>
                  <div style={{ fontWeight:500 }}>{selectedOrder.order.shippingAddress}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize:'0.875rem', fontWeight:600, color:'#64748b', marginBottom:'0.75rem' }}>
              Sản phẩm ({selectedOrder.details?.length || 0})
            </div>
            {selectedOrder.details?.map((d, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'0.75rem 0', borderBottom: i < selectedOrder.details.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ color:'#374151', fontWeight:500 }}>{d.product?.title || 'N/A'}</span>
                <div style={{ display:'flex', gap:'1.25rem', fontSize:'0.8rem', color:'#64748b' }}>
                  <span>{formatMoney(d.unitPrice)} × {d.quantity}</span>
                  <span style={{ color:'#16a34a', fontWeight:700 }}>{formatMoney(d.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
