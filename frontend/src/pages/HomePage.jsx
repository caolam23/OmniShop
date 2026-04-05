import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productApi from '../api/productApi';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(0); // Mock số lượng giỏ hàng

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Lấy 20 sản phẩm mới nhất ra trang chủ
        const res = await productApi.getAllProducts({ limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
        if (res.success) {
          setProducts(res.data);
          setFilteredProducts(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Xử lý tìm kiếm cơ bản ở Front-end
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowerCaseSearch = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(lowerCaseSearch) || 
          (p.description && p.description.toLowerCase().includes(lowerCaseSearch))
        )
      );
    }
  }, [searchTerm, products]);

  const handleAddToCart = (product) => {
    setCartCount(prev => prev + 1);
    alert(`Đã thêm "${product.name}" vào giỏ hàng!\n(Tính năng chi tiết do An Phong phát triển)`);
  };

  return (
    <div className={styles.homeContainer}>
      {/* Navbar Khách hàng */}
      <header className={styles.navbar}>
        <div className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          OmniShop
        </div>
        <nav className={styles.navLinks}>
          <Link to="/shop" className={styles.link}>Trang chủ</Link>
          <Link to="/login" className={styles.link}>Đăng nhập Admin</Link>
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

      {/* Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1>Khám phá bộ sưu tập mới</h1>
          <p>Sản phẩm chất lượng - Giá cả hợp lý - Giao hàng siêu tốc</p>
          <div className={styles.searchBar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm bạn yêu thích..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {searchTerm ? `Kết quả tìm kiếm cho "${searchTerm}"` : 'Sản phẩm nổi bật'}
          </h2>
          <span className={styles.productCount}>{filteredProducts.length} sản phẩm</span>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <div key={product._id} className={styles.productCard}>
                <div className={styles.imageContainer}>
                  {product.image ? (
                    <img src={`http://localhost:3000${product.image}`} alt={product.name} loading="lazy" />
                  ) : (
                    <div className={styles.noImage}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <p>Chưa có ảnh</p>
                    </div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.categoryLabel}>{product.category?.name || 'Chung'}</span>
                  <h3 className={styles.productName} title={product.name}>{product.name}</h3>
                  <p className={styles.productPrice}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                  </p>
                  <button 
                    className={styles.addToCartBtn} 
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    {product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                  </button>
                </div>
              </div>
            )) : (
              <div className={styles.noResults}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <p>Không tìm thấy sản phẩm nào phù hợp.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}