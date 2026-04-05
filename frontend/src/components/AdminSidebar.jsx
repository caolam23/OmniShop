import { Link, useLocation } from 'react-router-dom';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

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
          <Link to="/users" className={`${styles.navItem} ${currentPath === '/users' ? styles.navItemActive : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Quản lý Users
          </Link>
        </li>
        <li>
          <Link to="/roles" className={`${styles.navItem} ${currentPath === '/roles' ? styles.navItemActive : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
              <path d="M12 8v8"></path>
              <path d="M9 12h6"></path>
            </svg>
            Phân quyền (Roles)
          </Link>
        </li>
        <li>
          <Link to="/products" className={`${styles.navItem} ${currentPath === '/products' ? styles.navItemActive : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Sản phẩm & Kho
          </Link>
        </li>
      </ul>
    </aside>
  );
}