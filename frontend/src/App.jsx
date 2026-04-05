import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import HomePage from './pages/HomePage';
import ProductManagement from './pages/ProductManagement';
import CategoryManagement from './pages/CategoryManagement';
import SupplierManagement from './pages/SupplierManagement';
import ProductDetail from './pages/ProductDetail';
import './App.css';

// Protected Route Component - Check token and optional role
function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check user's role
  if (allowedRoles.length > 0 && userStr) {
    try {
      const user = JSON.parse(userStr);
      const userRole = user.role?.name || user.role;

      if (!allowedRoles.includes(userRole)) {
        // User doesn't have required role - redirect to user profile
        return (
          <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <h2>❌ Access Denied</h2>
              <p className="text-muted">
                You don't have permission to access this page.
              </p>
              <p className="text-muted">Your role: {userRole}</p>
              <a href="/user" className="btn btn-primary mt-3">
                Back to Profile
              </a>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error parsing user:', error);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // initialize app
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Shop Route */}
        <Route path="/shop" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - User Profile (all authenticated users) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Dashboard (Admin Only) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <RoleManagement />
            </ProtectedRoute>
          }
        />

        {/* Quản lý Sản phẩm (Admin Only) */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />

        {/* Quản lý Danh mục */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <CategoryManagement />
            </ProtectedRoute>
          }
        />

        {/* Quản lý Nhà cung cấp */}
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <SupplierManagement />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Not Found */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
