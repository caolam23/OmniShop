import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userApi from '../api/userApi';
import roleApi from '../api/roleApi';
import authApi from '../api/authApi';
import styles from './UserManagement.module.css';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', roleId: '' });

  // Load users and roles
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userApi.getAllUsers();
      if (response.success) {
        // response.data pode ser um array ou um objeto com propriedade 'users'
        const usersData = Array.isArray(response.data) ? response.data : response.data?.users || [];
        setUsers(usersData);
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await roleApi.getAllRoles();
      if (response.success) {
        const rolesData = Array.isArray(response.data) ? response.data : response.data?.roles || [];
        setRoles(rolesData);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Open modal for creating new user
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ username: '', email: '', password: '', roleId: '' });
    setShowModal(true);
  };

  // Open modal for editing user
  const handleEdit = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({ 
      username: user.username, 
      email: user.email,
      roleId: user.role?._id || ''
    });
    setShowModal(true);
  };

  // Handle form submit (create or update)
  const handleSubmit = async () => {
    if (!formData.username || !formData.email) {
      setError('Please fill in all fields');
      return;
    }

    if (!isEditMode && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      setError('');
      let response;
      let submitData = { ...formData };

      if (isEditMode) {
        // Update existing user - không gửi password nếu không thay đổi
        delete submitData.password;
        response = await userApi.updateUser(selectedUser._id, submitData);
      } else {
        // Create new user
        response = await userApi.createUser(submitData);
      }

      if (response.success) {
        setSuccess(
          isEditMode ? 'User updated successfully!' : 'User created successfully!'
        );
        setShowModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Operation failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  // Soft delete user
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        const response = await userApi.deleteUser(userId);
        if (response.success) {
          setSuccess('User deleted successfully!');
          fetchUsers();
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

  // Restore deleted user
  const handleRestore = async (userId) => {
    try {
      setError('');
      const response = await userApi.restoreUser(userId);
      if (response.success) {
        setSuccess('User restored successfully!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Restore failed');
      }
    } catch (err) {
      setError(err?.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  // Force delete user
  const handleForceDelete = async (userId) => {
    if (
      window.confirm(
        'This action cannot be undone. Are you sure you want to permanently delete this user?'
      )
    ) {
      try {
        setError('');
        const response = await userApi.forceDeleteUser(userId);
        if (response.success) {
          setSuccess('User permanently deleted!');
          fetchUsers();
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
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedUsers = users.slice(startIdx, endIdx);

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ username: '', email: '', password: '', roleId: '' });
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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
            <a href="/users" className={`${styles.navItem} ${styles.navItemActive}`}>
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
            <a href="/roles" className={styles.navItem}>
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
            <a href="#" className={styles.navItem} title="Chưa có sẵn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Sản phẩm & Kho
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Quản lý Users</h1>
            <p className={styles.pageSubtitle}>Quản lý tài khoản người dùng hệ thống</p>
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
          <button className={styles.btnPrimary} onClick={handleAddNew}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Thêm Người Dùng Mới
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
                    <th className={styles.tableHeadCell}>Tên người dùng</th>
                    <th className={styles.tableHeadCell}>Email</th>
                    <th className={styles.tableHeadCell}>Phân quyền</th>
                    <th className={styles.tableHeadCell}>Trạng thái</th>
                    <th className={styles.tableHeadCell}>Hành động</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={user.isDeleted ? styles.deletedRow : ''}
                      >
                        <td className={`${styles.tableCell} ${user.isDeleted ? styles.tableCellDeleted : ''}`}>
                          {user.username}
                        </td>
                        <td className={`${styles.tableCell} ${user.isDeleted ? styles.tableCellDeleted : ''}`}>
                          {user.email}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.badge} ${styles.badgeInfo}`}>
                            {user.role?.name || 'N/A'}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {user.isDeleted ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>
                              Đã xóa
                            </span>
                          ) : (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {!user.isDeleted ? (
                              <>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#3b82f6', color: 'white' }}
                                  onClick={() => handleEdit(user)}
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                                  onClick={() => handleDelete(user._id)}
                                >
                                  🗑️ Xóa
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#f59e0b', color: 'white' }}
                                  onClick={() => handleRestore(user._id)}
                                >
                                  ↩️ Khôi phục
                                </button>
                                <button
                                  className={styles.btnSmall}
                                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                                  onClick={() => handleForceDelete(user._id)}
                                >
                                  ❌ Xóa vĩnh viễn
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
                        Chưa có người dùng nào
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
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ⏮️ Đầu
                </button>
                <button
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ⏪ Trước
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  ⏩ Sau
                </button>
                <button
                  className={styles.paginationBtn}
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  ⏭️ Cuối
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
                  {isEditMode ? 'Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
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
                  <label className={styles.formLabel}>Tên người dùng</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Nhập tên người dùng"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                {!isEditMode && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mật khẩu</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Nhập mật khẩu"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vai Trò (Role)</label>
                  <select
                    className={styles.formSelect}
                    value={formData.roleId}
                    onChange={(e) =>
                      setFormData({ ...formData, roleId: e.target.value })
                    }
                  >
                    <option value="">-- Chọn Vai Trò --</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
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
