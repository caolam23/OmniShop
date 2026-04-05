import { useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function NavBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy user info từ localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    // Xóa token và user từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect về login
    navigate('/login');
  };

  return (
    <Navbar expand="lg" sticky="top" className={styles.navbar}>
      <div className="container-fluid">
        <Navbar.Brand style={{ cursor: 'pointer' }} onClick={() => navigate(user?.role?.name === 'Admin' || user?.role === 'Admin' ? '/dashboard' : '/shop')} className={styles.brand}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          OmniShop
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate('/shop')} className={styles.navLink}>Trang chủ</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-3">
            <span className={styles.userInfo}>
              {user?.username && `Xin chào, ${user.username}`}
            </span>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
}
