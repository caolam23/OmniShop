import { useNavigate } from 'react-router-dom';
import { Navbar, Container, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import NotificationBell from './Notification/NotificationBell';

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
    <Navbar bg="dark" expand="lg" sticky="top" className="navbar-dark">
      <div className="container-fluid">
        <Navbar.Brand href="/dashboard" className="fw-bold">
          🛍️ OmniShop Admin
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <div className="d-flex align-items-center gap-3">
            <NotificationBell />
            <span className="text-white">
              {user?.username && `Welcome, ${user.username}`}
            </span>
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
}
