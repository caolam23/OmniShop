import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import cartApi from '../api/cartApi';
import orderApi from '../api/orderApi';
import styles from './CheckoutPage.module.css';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appliedCoupon, discountAmount, total } = location.state || {};
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await cartApi.getCart();
        if (res.success && res.data.products.length > 0) {
          setCart(res.data);
        } else {
          // Nếu giỏ hàng trống thì quay về trang giỏ hàng
          navigate('/cart');
        }
      } catch (err) {
        console.error('Lỗi khi tải giỏ hàng:', err);
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const calculateTotal = () => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ nhận hàng!');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await orderApi.checkout({ 
        shippingAddress: address, 
        note,
        couponCode: appliedCoupon?.code 
      });
      if (res.order) {
        // Hiển thị modal thay vì alert
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}><div className={styles.spinner}></div>Đang tải thông tin...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <Link to="/cart" className={styles.backBtn}>← Quay lại giỏ hàng</Link>
        <h1>Thanh Toán</h1>
      </header>

      <main className={styles.mainContent}>
        <form className={styles.checkoutForm} onSubmit={handleCheckout}>
          <section className={styles.formSection}>
            <h2>Thông tin giao hàng</h2>
            {error && <div className={styles.errorMessage}>{error}</div>}
            <div className={styles.formGroup}>
              <label>Địa chỉ nhận hàng (*)</label>
              <input type="text" placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..." value={address} onChange={(e) => setAddress(e.target.value)} disabled={isSubmitting} required />
            </div>
            <div className={styles.formGroup}>
              <label>Ghi chú cho đơn hàng</label>
              <textarea placeholder="Ghi chú về thời gian giao hàng, địa điểm chi tiết..." value={note} onChange={(e) => setNote(e.target.value)} disabled={isSubmitting} rows="4"></textarea>
            </div>
          </section>

          <aside className={styles.summarySection}>
            <h2>Đơn hàng của bạn</h2>
            <div className={styles.productList}>
              {cart?.products.map((item) => (
                <div key={item.product._id} className={styles.productItem}>
                  <span>{item.quantity} x {item.product.name}</span>
                  <span>{formatVND(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <hr />
            <div className={styles.totalRow}>
              <span>Tạm tính:</span>
              <span>{formatVND(calculateTotal())}</span>
            </div>
            {appliedCoupon && (
              <div className={styles.totalRow} style={{ color: '#16a34a', marginTop: '0.5rem' }}>
                <span>Giảm giá ({appliedCoupon.code}):</span>
                <span>-{formatVND(discountAmount)}</span>
              </div>
            )}
            <div className={styles.totalRow} style={{ marginTop: '0.5rem' }}>
              <span>Tổng cộng:</span>
              <span className={styles.totalAmount}>{formatVND(total !== undefined ? total : calculateTotal())}</span>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt hàng'}
            </button>
          </aside>
        </form>
      </main>

      {/* Modal Đặt hàng thành công */}
      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.successIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className={styles.modalTitle}>Đặt hàng thành công!</h2>
            <p className={styles.modalText}>Cảm ơn bạn đã mua sắm tại OmniShop.</p>
            <button className={styles.modalButton} onClick={() => navigate('/my-orders')}>
              Xem lịch sử đơn hàng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}