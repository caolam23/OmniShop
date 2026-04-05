import { useState } from 'react';
import { Container } from 'react-bootstrap';
import NavBar from './Navbar';
import Sidebar from './Sidebar';
import ChatBox from './ChatBox/ChatBox';
import AdminChatPanel from './ChatBox/AdminChatPanel';
import './Layout.css';

export default function Layout({ children }) {
  const [sidebarShow, setSidebarShow] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar (includes NotificationBell) */}
      <NavBar />

      {/* Main Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar - Desktop */}
        <Sidebar show={sidebarShow} onClose={() => setSidebarShow(false)} />

        {/* Content */}
        <div className="main-content w-100">
          <div className="container-fluid py-4">
            {children}
          </div>
        </div>
      </div>
      <ChatBox />
      <AdminChatPanel />
    </div>
  );
}
