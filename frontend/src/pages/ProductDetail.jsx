import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import ReviewSection from '../components/Review/ReviewSection';
import styles from './ProductDetail.module.css';

export default function ProductDetail() {
  const { id } = useParams(); // Lấy ID sản phẩm từ URL
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0); // Mock giỏ hàng
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (err) { }
    }

    // Fetch chi tiết sản phẩm
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await productApi.getProductById(id);
        if (res.success) {
          setProduct(res.data);
        } else {
          setError(res.message || 'Không tìm thấy sản phẩm');
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    setCartCount(prev => prev + quantity);
    alert(`Đã thêm ${quantity} "${product.name}" vào giỏ hàng!`);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    if (val >= 1 && val <= (product?.stock || 1)) {
      setQuantity(val);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
  }

  if (error || !product) {
    return (
      <div className={styles.errorContainer}>
        <h2>{error || 'Sản phẩm không tồn tại'}</h2>
        <button onClick={() => navigate('/shop')} className={styles.backBtn}>Quay lại cửa hàng</button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header dùng chung giống HomePage */}
      <header className={styles.navbar}>
        <Link to="/shop" className={styles.logoWrapper} style={{ textDecoration: 'none' }}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            OmniShop
          </div>
        </Link>
        <nav className={styles.navLinks}>
          <Link to="/shop" className={styles.link}>Trang chủ</Link>
          {user ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                Xin chào, <Link to="/user"><strong>{user.username}</strong></Link>
              </span>
            </div>
          ) : (
            <Link to="/login" className={styles.link}>Đăng nhập</Link>
          )}
          <div className={styles.cartIconWrapper} onClick={() => alert('Mở giỏ hàng')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <button onClick={() => navigate('/shop')} className={styles.backLink}>
          ← Quay lại cửa hàng
        </button>

        <div className={styles.productDetailGrid}>
          <div className={styles.imageSection}>
            {product.image ? (
              <img src={`http://localhost:3000${product.image}`} alt={product.name} />
            ) : (
              <div className={styles.noImage}>Chưa có ảnh</div>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.headerInfo}>
              <div className={styles.categoryLabel}>{product.category?.name || 'Chung'}</div>
              <h1 className={styles.productName}>{product.name}</h1>
            </div>

            <div className={styles.priceRow}>
              <div className={styles.productPrice}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
              </div>
              <div className={styles.stockStatus}>
                {product.stock > 0 ? (
                  <span className={styles.inStock}>Còn hàng: {product.stock}</span>
                ) : (
                  <span className={styles.outOfStock}>Hết hàng</span>
                )}
              </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.descriptionBox}>
              <h3>Mô tả chi tiết</h3>
              <p>{product.description || 'Sản phẩm này chưa có bài viết mô tả chi tiết.'}</p>
            </div>

            {product.supplier && (
              <div className={styles.supplierBox}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span><strong>Nhà cung cấp:</strong> {product.supplier.name}</span>
              </div>
            )}

            <div className={styles.actionWrapper}>
              <div className={styles.actionSection}>
                <div className={styles.quantityControl}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1 || product.stock === 0}>-</button>
                  <input type="number" value={quantity} onChange={handleQuantityChange} min="1" max={product.stock} disabled={product.stock === 0} />
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock || product.stock === 0}>+</button>
                </div>
                <button className={styles.addToCartBtn} onClick={handleAddToCart} disabled={product.stock <= 0}>
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <ReviewSection productId={id} />
      </main>
    </div>
  );
}