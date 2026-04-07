import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import categoryApi from '../api/categoryApi';
import authApi from '../api/authApi';
import cartApi from '../api/cartApi';
import styles from './HomePage.module.css';
import NotificationDropdown from '../components/Notification/NotificationDropdown';
import { useSocket } from '../hooks/useSocket';

// Hằng số cấu hình (Nên đưa vào file config riêng nếu có thể)
const IMAGE_BASE_URL = 'http://localhost:3000';

// Helper format tiền tệ VND
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartCount, setCartCount] = useState(0); 
  const [sortOption, setSortOption] = useState('newest'); 
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  const [latestNotification, setLatestNotification] = useState(null);

  useSocket(user?._id || user?.id, null, null, null, (notif) => {
    setLatestNotification(notif);
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (err) {
        console.error('Lỗi khi tải thông tin user:', err);
      }
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Tải song song cả sản phẩm và danh mục
        const [prodRes, catRes] = await Promise.all([
          productApi.getAllProducts({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }), // Tăng limit để test lọc client-side
          categoryApi.getAllCategories()
        ]);

        if (prodRes.success) {
          setProducts(prodRes.data);
          setFilteredProducts(prodRes.data);
          
          // Nếu đã đăng nhập, tải số lượng giỏ hàng thực tế
          if (userStr) {
            const cartRes = await cartApi.getCart();
            if (cartRes.success) {
              setCartCount(cartRes.data.products.length);
            }
          }
        }
        if (catRes.success) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);


  useEffect(() => {
    let result = [...products]; 
    if (selectedCategory !== '') {
      result = result.filter(p => p.category?._id === selectedCategory || p.category === selectedCategory);
    }
    if (searchTerm.trim() !== '') {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerCaseSearch) || 
        (p.description && p.description.toLowerCase().includes(lowerCaseSearch))
      );
    }

    // 3. Sắp xếp sản phẩm
    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // Mặc định là mới nhất
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, sortOption, products]);

  const handleAddToCart = async (product) => {
    try {
      const res = await cartApi.addToCart({ productId: product._id, quantity: 1 });
      if (res.success) {
        setCartCount(res.data.products.length);
        setAddedProduct(product);
        setShowModal(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Vui lòng đăng nhập để mua hàng');
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className={styles.homeContainer}>
      {/* Navbar Khách hàng */}
      <header className={styles.navbar}>
        <Link to="/shop" className={styles.logo} style={{ textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          OmniShop
        </Link>
        <nav className={styles.navLinks}>
          {user && (
            <NotificationDropdown 
              userId={user._id || user.id} 
              latestNotification={latestNotification} 
            />
          )}
          <Link to="/shop" className={styles.link}>Trang chủ</Link>
          {user ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                Xin chào,{' '}
                <Link to="/user"><strong>{user.username}</strong></Link>
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className={styles.link}>Đăng nhập</Link>
          )}

          <Link to="/cart" className={styles.cartIconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>
        </nav>
      </header>

      {/* Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <h1>Omni Shop</h1>
          <p> Mua sắm thông minh, giao hàng chớp mắt!</p>
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
        {/* Bộ lọc Danh mục */}
        {!loading && categories.length > 0 && (
          <div className={styles.categoryFilter}>
            {/* Nút "Tất cả" */}
            <div 
              className={`${styles.categoryItem} ${selectedCategory === '' ? styles.activeCategory : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              <div className={styles.categoryImageWrapper}>
                <div className={styles.categoryPlaceholder}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
              </div>
              <span className={styles.categoryName}>Tất cả</span>
            </div>
            
            {/* Danh sách các danh mục có hình ảnh */}
            {categories.map(cat => (
              <div 
                key={cat._id}
                className={`${styles.categoryItem} ${selectedCategory === cat._id ? styles.activeCategory : ''}`}
                onClick={() => setSelectedCategory(cat._id)}
              >
                <div className={styles.categoryImageWrapper}>
                  {cat.image ? (
                    <img src={`http://localhost:3000${cat.image}`} alt={cat.name} className={styles.categoryImg} loading="lazy" />
                  ) : (
                    <div className={styles.categoryPlaceholder}>
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className={styles.categoryName}>{cat.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {searchTerm ? `Kết quả tìm kiếm cho "${searchTerm}"` : 'Sản phẩm nổi bật'}
            </h2>
            <span className={styles.productCount}>{filteredProducts.length} sản phẩm</span>
          </div>

          {/* Dropdown Sắp xếp */}
          <div className={styles.sortContainer}>
            <span className={styles.sortLabel}>Sắp xếp:</span>
            <select 
              className={styles.sortSelect}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
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
                <Link to={`/product/${product._id}`} className={styles.imageContainer}>
                  {product.image ? (
                    <img src={`${IMAGE_BASE_URL}${product.image}`} alt={product.name} loading="lazy" />
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
                </Link>
                <div className={styles.productInfo}>
                  <span className={styles.categoryLabel}>{product.category?.name || 'Chung'}</span>
                  <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                    <h3 className={styles.productName} title={product.name}>{product.name}</h3>
                  </Link>
                  <p className={styles.productPrice}>{formatVND(product.price)}</p>
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

      {/* Modal Thêm vào giỏ hàng thành công */}
      {showModal && (
        <div onClick={() => setShowModal(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'white', borderRadius:'16px', width:'400px', maxWidth:'90vw',
              padding:'2.5rem 2rem', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation: 'modalFadeIn 0.3s ease-out' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#1f2937', marginBottom:'0.5rem', marginTop: 0 }}>Thành công!</h2>
            <p style={{ color:'#6b7280', marginBottom:'2rem' }}>Đã thêm <strong>{addedProduct?.name}</strong> vào giỏ hàng.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, background:'#f3f4f6', color:'#4b5563', border:'none', padding:'0.75rem', borderRadius:'8px', fontWeight:600, cursor:'pointer', transition: 'background 0.2s' }}>
                Tiếp tục mua
              </button>
              <button onClick={() => navigate('/cart')}
                style={{ flex: 1, background:'#16a34a', color:'white', border:'none', padding:'0.75rem', borderRadius:'8px', fontWeight:600, cursor:'pointer', transition: 'background 0.2s' }}>
                Đến giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}