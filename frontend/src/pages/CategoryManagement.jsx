import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import categoryApi from '../api/categoryApi';
import authApi from '../api/authApi';
import styles from './CategoryManagement.module.css';

export default function CategoryManagement() {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(true); // Mở sẵn menu vì đang ở mục này

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoryApi.getAllCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.message || 'Không thể tải danh sách danh mục');
      }
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (category) => {
    setIsEditMode(true);
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Tên danh mục là bắt buộc!');
      return;
    }

    try {
      setError('');
      let response;
      if (isEditMode) {
        response = await categoryApi.updateCategory(selectedCategory._id, formData);
      } else {
        response = await categoryApi.createCategory(formData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.message || 'Lỗi khi lưu danh mục');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const response = await categoryApi.deleteCategory(id);
        if (response.success) {
          setSuccess('Đã xóa danh mục!');
          fetchCategories();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError(err?.message || 'Lỗi khi xóa');
      }
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  // Pagination
  const totalPages = Math.ceil(categories.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = categories.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className={styles.pageContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>OmniShop</div>
        <ul className={styles.navMenu}>
          <li><a href="/dashboard" className={styles.navItem}>Dashboard</a></li>
          <li><a href="/users" className={styles.navItem}>Quản lý Users</a></li>
          <li><a href="/roles" className={styles.navItem}>Phân quyền (Roles)</a></li>
          <li>
            <div 
              className={`${styles.navItem} ${styles.navItemParent} ${isProductMenuOpen ? styles.navItemActive : ''}`}
              onClick={() => setIsProductMenuOpen(!isProductMenuOpen)}
            >
              <div className={styles.navItemLeft}>Sản phẩm & Kho</div>
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

      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Quản lý Danh mục</h1>
            <p className={styles.pageSubtitle}>Phân loại sản phẩm trong cửa hàng</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        <div style={{ marginBottom: '1.5rem' }}>
          <button className={styles.btnPrimary} onClick={handleAddNew}>
            + Thêm Danh Mục
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Tên Danh Mục</th>
                  <th className={styles.tableHeadCell}>Mô Tả</th>
                  <th className={styles.tableHeadCell}>Hành Động</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {paginatedCategories.length > 0 ? paginatedCategories.map(c => (
                  <tr key={c._id}>
                    <td className={styles.tableCell}><strong>{c.name}</strong></td>
                    <td className={styles.tableCell}>{c.description || '--'}</td>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`${styles.btnSmall} ${styles.btnEdit}`} onClick={() => handleEdit(c)}>Sửa</button>
                        <button className={`${styles.btnSmall} ${styles.btnDelete}`} onClick={() => handleDelete(c._id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className={styles.noData}>Chưa có danh mục nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`${styles.paginationBtn} ${currentPage === i + 1 ? styles.paginationBtnActive : ''}`} onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {showModal && (
          <div className={`${styles.modal} ${styles.show}`}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{isEditMode ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</h2>
                <button className={styles.modalCloseBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên Danh Mục *</label>
                  <input type="text" className={styles.formInput} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô Tả</label>
                  <textarea className={styles.formInput} rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={`${styles.modalFooterBtn} ${styles.modalFooterBtnCancel}`} onClick={() => setShowModal(false)}>Hủy</button>
                <button className={`${styles.modalFooterBtn} ${styles.modalFooterBtnSubmit}`} onClick={handleSubmit}>Lưu</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}