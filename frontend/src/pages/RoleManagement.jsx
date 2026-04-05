import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roleApi from '../api/roleApi';
import authApi from '../api/authApi';
import styles from './RoleManagement.module.css';

// Định nghĩa danh sách Quyền hạn (Permissions List) chia theo Module
const PERMISSIONS_LIST = {
  system: {
    label: 'Hệ Thống',
    permissions: [
      { code: '*', label: 'Toàn Quyền (All Access)' }
    ]
  },
  products: {
    label: 'Sản Phẩm & Kho Hàng',
    permissions: [
      { code: 'products:read', label: 'Xem Sản Phẩm' },
      { code: 'products:create', label: 'Thêm Sản Phẩm' },
      { code: 'products:update', label: 'Sửa Sản Phẩm' },
      { code: 'products:delete', label: 'Xóa Sản Phẩm' }
    ]
  },
  orders: {
    label: 'Đơn Hàng',
    permissions: [
      { code: 'orders:read', label: 'Xem Đơn Hàng' },
      { code: 'orders:create', label: 'Tạo Đơn Hàng' },
      { code: 'orders:update', label: 'Cập Nhật Đơn Hàng' },
      { code: 'orders:delete', label: 'Xóa Đơn Hàng' }
    ]
  },
  users: {
    label: 'Người Dùng',
    permissions: [
      { code: 'users:read', label: 'Xem Người Dùng' },
      { code: 'users:create', label: 'Tạo Người Dùng' },
      { code: 'users:update', label: 'Cập Nhật Người Dùng' },
      { code: 'users:delete', label: 'Xóa Người Dùng' }
    ]
  }
};

export default function RoleManagement() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });

  // Load roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await roleApi.getAllRoles();
      if (response.success) {
        const rolesData = Array.isArray(response.data) ? response.data : response.data?.roles || [];
        setRoles(rolesData);
      } else {
        setError(response.message || 'Failed to load roles');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating new role
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  // Open modal for editing role
  const handleEdit = (role) => {
    setIsEditMode(true);
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setShowModal(true);
  };

  // Handle checkbox change
  const handlePermissionChange = (permissionCode) => {
    setFormData((prev) => {
      const currentPermissions = [...(prev.permissions || [])];
      
      // Nếu Toàn Quyền được chọn, bỏ toàn bộ quyền khác
      if (permissionCode === '*') {
        return {
          ...prev,
          permissions: currentPermissions.includes('*') ? [] : ['*']
        };
      }

      // Nếu Toàn Quyền đang được chọn, bỏ nó đi khi chọn quyền khác
      const filteredPermissions = currentPermissions.filter(p => p !== '*');

      if (filteredPermissions.includes(permissionCode)) {
        // Bỏ quyền này đi
        return {
          ...prev,
          permissions: filteredPermissions.filter(p => p !== permissionCode)
        };
      } else {
        // Thêm quyền này vào
        return {
          ...prev,
          permissions: [...filteredPermissions, permissionCode]
        };
      }
    });
  };

  // Handle form submit (create or update)
  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Please fill in role name');
      return;
    }

    try {
      setError('');
      const submitData = {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions || [],
      };

      let response;

      if (isEditMode) {
        response = await roleApi.updateRole(selectedRole._id, submitData);
      } else {
        response = await roleApi.createRole(submitData);
      }

      if (response.success) {
        setSuccess(
          isEditMode ? 'Role updated successfully!' : 'Role created successfully!'
        );
        setShowModal(false);
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  // Soft delete role
  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        setError('');
        const response = await roleApi.deleteRole(roleId);
        if (response.success) {
          setSuccess('Role deleted successfully!');
          fetchRoles();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(response.message || 'Delete failed');
        }
      } catch (err) {
        setError(err?.message || 'An error occurred');
        console.error('Error:', err);
      }
    }
  };

  // Restore deleted role
  const handleRestore = async (roleId) => {
    try {
      setError('');
      const response = await roleApi.restoreRole(roleId);
      if (response.success) {
        setSuccess('Role restored successfully!');
        fetchRoles();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Restore failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  // Force delete role
  const handleForceDelete = async (roleId) => {
    if (
      window.confirm(
        'This action cannot be undone. Are you sure you want to permanently delete this role?'
      )
    ) {
      try {
        setError('');
        const response = await roleApi.forceDeleteRole(roleId);
        if (response.success) {
          setSuccess('Role permanently deleted!');
          fetchRoles();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(response.message || 'Permanent delete failed');
        }
      } catch (err) {
        setError(err?.message || 'An error occurred');
        console.error('Error:', err);
      }
    }
  };

  // Pagination
  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedRoles = roles.slice(startIdx, endIdx);

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Check if "All" permission is selected
  const hasAllPermission = formData.permissions?.includes('*');

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
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
            <a href="/dashboard" className={styles.navItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </a>
          </li>
          <li>
            <a href="/users" className={styles.navItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Quản lý Users
            </a>
          </li>
          <li>
            <a href="/roles" className={`${styles.navItem} ${styles.navItemActive}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
                <path d="M12 8v8"></path>
                <path d="M9 12h6"></path>
              </svg>
              Phân quyền (Roles)
            </a>
          </li>
          <li>
            <div 
              className={`${styles.navItem} ${styles.navItemParent} ${isProductMenuOpen ? styles.navItemActive : ''}`}
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
                <a href="/products" className={`${styles.subNavItem} ${window.location.pathname === '/products' ? styles.subNavItemActive : ''}`}>Danh sách Sản phẩm</a>
                <a href="/categories" className={`${styles.subNavItem} ${window.location.pathname === '/categories' ? styles.subNavItemActive : ''}`}>Danh mục</a>
                <a href="/suppliers" className={`${styles.subNavItem} ${window.location.pathname === '/suppliers' ? styles.subNavItemActive : ''}`}>Nhà cung cấp</a>
              </div>
            )}
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Phân quyền (Roles)</h1>
            <p className={styles.pageSubtitle}>Quản lý các vai trò và quyền hạn của hệ thống</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.alertError}>{error}</div>
        )}

        {/* Success Alert */}
        {success && (
          <div className={styles.alertSuccess}>{success}</div>
        )}

        {/* Add Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button className={styles.btnPrimary} onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm Vai Trò Mới
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeadCell}>Tên Vai Trò</th>
                    <th className={styles.tableHeadCell}>Mô Tả</th>
                    <th className={styles.tableHeadCell}>Quyền Hạn</th>
                    <th className={styles.tableHeadCell}>Trạng Thái</th>
                    <th className={styles.tableHeadCell}>Hành Động</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {paginatedRoles.length > 0 ? (
                    paginatedRoles.map((role) => (
                      <tr
                        key={role._id}
                        className={role.isDeleted ? styles.deletedRow : ''}
                      >
                        <td className={`${styles.tableCell} ${role.isDeleted ? styles.tableCellDeleted : ''}`}>
                          <span className={`${styles.badge} ${styles.badgeInfo}`}>{role.name}</span>
                        </td>
                        <td className={`${styles.tableCell} ${role.isDeleted ? styles.tableCellDeleted : ''}`}>
                          {role.description || 'Chưa có mô tả'}
                        </td>
                        <td className={`${styles.tableCell} ${role.isDeleted ? styles.tableCellDeleted : ''}`}>
                          <small>
                            {role.permissions && role.permissions.length > 0
                              ? role.permissions.slice(0, 2).join(', ') +
                                (role.permissions.length > 2
                                  ? ` +${role.permissions.length - 2} quyền khác`
                                  : '')
                              : 'Không có quyền'}
                          </small>
                        </td>
                        <td className={styles.tableCell}>
                          {role.isDeleted ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>Đã xóa</span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Hoạt động</span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {!role.isDeleted ? (
                              <>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleEdit(role)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  Sửa
                                </button>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleDelete(role._id)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                  Xóa
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleRestore(role._id)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 14 4 9 9 4"></polyline>
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                  </svg>
                                  Khôi phục
                                </button>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleForceDelete(role._id)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                  </svg>
                                  Xóa vĩnh viễn
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className={styles.noData}>
                        Chưa có vai trò nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <button
                  className={styles.paginationBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="19 20 9 12 19 4 19 20"></polygon>
                    <line x1="5" y1="19" x2="5" y2="5"></line>
                  </svg>
                  Đầu
                </button>
                <button
                  className={styles.paginationBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Trước
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    className={`${styles.paginationBtn} ${
                      currentPage === idx + 1 ? styles.paginationBtnActive : ''
                    }`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  className={styles.paginationBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <button
                  className={styles.paginationBtn}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Cuối
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className={`${styles.modal} ${styles.show}`}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {isEditMode ? 'Sửa Vai Trò' : 'Thêm Vai Trò Mới'}
                </h2>
                <button
                  className={styles.modalCloseBtn}
                  onClick={handleCloseModal}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên Vai Trò</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="ví dụ: Admin, Manager, User"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô Tả</label>
                  <textarea
                    className={styles.formInput}
                    rows={3}
                    placeholder="Mô tả vai trò này"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  ></textarea>
                </div>

                {/* Permissions Checkbox Groups */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quyền Hạn</label>
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    backgroundColor: '#f8fafc'
                  }}>
                    {Object.entries(PERMISSIONS_LIST).map(([key, group]) => (
                      <div key={key} style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: '#0f172a',
                          marginBottom: '0.75rem',
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>
                          {group.label}
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '0.75rem'
                        }}>
                          {group.permissions.map((permission) => (
                            <label
                              key={permission.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: permission.code === '*' || !hasAllPermission ? 'pointer' : 'not-allowed',
                                opacity: permission.code !== '*' && hasAllPermission ? 0.5 : 1,
                                fontWeight: 500,
                                fontSize: '0.9rem'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions?.includes(permission.code) || false}
                                onChange={() => handlePermissionChange(permission.code)}
                                disabled={permission.code !== '*' && hasAllPermission}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: permission.code === '*' || !hasAllPermission ? 'pointer' : 'not-allowed'
                                }}
                              />
                              <span>{permission.label}</span>
                            </label>
                          ))}
                        </div>
                        {key !== 'system' && (
                          <hr style={{
                            border: 'none',
                            borderTop: '1px solid #e2e8f0',
                            margin: '1rem 0 0 0'
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <small style={{ color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    Khi chọn "Toàn Quyền", các quyền khác sẽ bị vô hiệu hóa.
                  </small>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={`${styles.modalFooterBtn} ${styles.modalFooterBtnCancel}`}
                  onClick={handleCloseModal}
                >
                  Hủy bỏ
                </button>
                <button
                  className={`${styles.modalFooterBtn} ${styles.modalFooterBtnSubmit}`}
                  onClick={handleSubmit}
                >
                  {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}