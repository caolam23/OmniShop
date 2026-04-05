import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cartApi from '../api/cartApi';
import styles from './CartPage.module.css';

// Hằng số cấu hình
const IMAGE_BASE_URL = 'http://localhost:3000';

// Helper format tiền tệ VND
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartApi.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải giỏ hàng:', err);
      // Nếu lỗi 401 (chưa đăng nhập) thì chuyển hướng
      if (err.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQty) => {
    if (newQty < 1) return;
    try {
      const res = await cartApi.updateQuantity({ productId, quantity: newQty });
      if (res.success) setCart(res.data);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Lỗi khi cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;
    try {
      const res = await cartApi.removeFromCart(productId);
      if (res.success) setCart(res.data);
    } catch (err) {
       console.error(err); 
      alert('Lỗi khi xóa sản phẩm');
    }
  };

  const handleApplyCoupon = () => {
    // Giả lập logic mã giảm giá (Bạn có thể viết thêm API Coupon sau)
    if (coupon.toUpperCase() === 'OMNISHOP') {
      setDiscount(50000); // Giảm thẳng 50k
      alert('Áp dụng mã giảm giá thành công!');
    } else {
      alert('Mã giảm giá không hợp lệ');
      setDiscount(0);
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.products) return 0;
    return cart.products.reduce((acc, item) => {
      return acc + (item.product.price * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const total = Math.max(0, subtotal - discount);

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Đang tải giỏ hàng...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/shop" className={styles.backBtn}>← Tiếp tục mua sắm</Link>
        <h1>Giỏ hàng của bạn</h1>
      </header>

      {!cart || cart.products.length === 0 ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <p>Giỏ hàng của bạn còn trống</p>
          <Link to="/shop" className={styles.shopNowBtn}>Mua sắm ngay</Link>
        </div>
      ) : (
        <div className={styles.cartContent}>
          <div className={styles.itemList}>
            {cart.products.map((item) => (
              <div key={item.product._id} className={styles.cartItem}>
                <Link to={`/product/${item.product._id}`} className={styles.imageWrapper}>
                  <img 
                    src={item.product.image ? `${IMAGE_BASE_URL}${item.product.image}` : '/placeholder.png'} 
                    alt={item.product.name} 
                    className={styles.itemImage}
                  />
                </Link>
                <div className={styles.itemInfo}>
                  <Link to={`/product/${item.product._id}`} className={styles.itemName}>
                    <h3>{item.product.name}</h3>
                  </Link>
                  <p className={styles.itemPrice}>{formatVND(item.product.price)}</p>
                  
                  <div className={styles.mobileActions}>
                    <div className={styles.quantityControls}>
                      <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                      <input type="text" value={item.quantity} readOnly />
                      <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}>+</button>
                    </div>
                    <button className={styles.removeBtnMobile} onClick={() => handleRemoveItem(item.product._id)}>Xóa</button>
                  </div>
                </div>
                <div className={`${styles.quantityControls} ${styles.desktopOnly}`}>
                  <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                  <input type="text" value={item.quantity} readOnly />
                  <button onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}>+</button>
                </div>
                <div className={`${styles.itemTotal} ${styles.desktopOnly}`}>
                  {formatVND(item.product.price * item.quantity)}
                </div>
                <button className={`${styles.removeBtn} ${styles.desktopOnly}`} onClick={() => handleRemoveItem(item.product._id)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <aside className={styles.summaryCard}>
            <h2>Tổng thanh toán</h2>
            
            <div className={styles.couponSection}>
              <input 
                type="text" 
                placeholder="Nhập mã giảm giá..." 
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button onClick={handleApplyCoupon}>Áp dụng</button>
            </div>

            <div className={styles.summaryRow}>
              <span>Tạm tính:</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discount}`}>
                <span>Giảm giá:</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            <hr />
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Tổng cộng:</span>
              <span className={styles.totalAmount}>{formatVND(total)}</span>
            </div>

            <button className={styles.checkoutBtn} onClick={() => alert('Hệ thống đang chuyển sang trang thanh toán!')}>
              Tiến hành đặt hàng
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}