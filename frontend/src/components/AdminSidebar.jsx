import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isProductPath = ['/products', '/categories', '/suppliers'].includes(currentPath);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(isProductPath);

  const isUserPath = ['/users', '/roles'].includes(currentPath);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(isUserPath);

  // Tự động giữ trạng thái mở nếu đang ở nhóm trang Sản phẩm & Kho
  useEffect(() => {
    if (isProductPath) {
      setIsProductMenuOpen(true);
    }
    if (isUserPath) {
      setIsUserMenuOpen(true);
    }
  }, [currentPath, isProductPath, isUserPath]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <svg
          className={styles.brandSvg}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        OmniShop
      </div>
      <ul className={styles.navMenu}>
        <li>
          <Link to="/dashboard" className={`${styles.navItem} ${currentPath === '/dashboard' ? styles.navItemActive : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Dashboard
          </Link>
        </li>
        <li>
          <div 
            className={`${styles.navItem} ${styles.navItemParent} ${isUserPath || isUserMenuOpen ? styles.navItemActive : ''}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className={styles.navItemLeft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Quản lý Users
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          {isUserMenuOpen && (
            <div className={styles.subMenu}>
              <Link to="/users" className={`${styles.subNavItem} ${currentPath === '/users' ? styles.subNavItemActive : ''}`}>Danh sách User</Link>
              <Link to="/roles" className={`${styles.subNavItem} ${currentPath === '/roles' ? styles.subNavItemActive : ''}`}>Phân quyền (Roles)</Link>
            </div>
          )}
        </li>
        <li>
          <div 
            className={`${styles.navItem} ${styles.navItemParent} ${isProductPath || isProductMenuOpen ? styles.navItemActive : ''}`}
            onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
          >
            <div className={styles.navItemLeft}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Sản phẩm & Kho
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isProductMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          {isProductMenuOpen && (
            <div className={styles.subMenu}>
              <Link to="/products" className={`${styles.subNavItem} ${currentPath === '/products' ? styles.subNavItemActive : ''}`}>Danh sách Sản phẩm</Link>
              <Link to="/categories" className={`${styles.subNavItem} ${currentPath === '/categories' ? styles.subNavItemActive : ''}`}>Danh mục</Link>
              <Link to="/suppliers" className={`${styles.subNavItem} ${currentPath === '/suppliers' ? styles.subNavItemActive : ''}`}>Nhà cung cấp</Link>
            </div>
          )}
        </li>
        <li>
          <Link to="/coupons" className={`${styles.navItem} ${currentPath === '/coupons' ? styles.navItemActive : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Mã giảm giá
          </Link>
        </li>
      </ul>
    </aside>
  );
}