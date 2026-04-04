import { Nav, Offcanvas } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ show, onClose }) {
  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Users', href: '/users', icon: '👥' },
    { label: 'Roles', href: '/roles', icon: '🔐' },
    { label: 'Products', href: '/products', icon: '🛍️' },
    { label: 'Categories', href: '/categories', icon: '📂' },
    { label: 'Orders', href: '/orders', icon: '📦' },
    { label: 'Messages', href: '/messages', icon: '💬' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="sidebar d-none d-lg-block bg-light">
        <Nav className="flex-column p-3">
          {menuItems.map((item) => (
            <Nav.Link
              key={item.href}
              as={Link}
              to={item.href}
              className="sidebar-link"
            >
              <span className="me-2">{item.icon}</span>
              {item.label}
            </Nav.Link>
          ))}
        </Nav>
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={show} onHide={onClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {menuItems.map((item) => (
              <Nav.Link
                key={item.href}
                as={Link}
                to={item.href}
                onClick={onClose}
                className="text-dark"
              >
                <span className="me-2">{item.icon}</span>
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
