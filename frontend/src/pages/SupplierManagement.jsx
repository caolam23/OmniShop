import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierApi from '../api/supplierApi';
import authApi from '../api/authApi';
import AdminSidebar from '../components/AdminSidebar';
import styles from './SupplierManagement.module.css';

export default function SupplierManagement() {
  const navigate = useNavigate();
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await supplierApi.getAllSuppliers();
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        setError(response.message || 'Không thể tải danh sách nhà cung cấp');
      }
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setIsEditMode(true);
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setError('Tên nhà cung cấp là bắt buộc!');
      return;
    }

    try {
      setError('');
      let response;
      if (isEditMode) {
        response = await supplierApi.updateSupplier(selectedSupplier._id, formData);
      } else {
        response = await supplierApi.createSupplier(formData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        setShowModal(false);
        fetchSuppliers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.message || 'Lỗi khi lưu thông tin');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) {
      try {
        const response = await supplierApi.deleteSupplier(id);
        if (response.success) {
          setSuccess('Đã xóa nhà cung cấp!');
          fetchSuppliers();
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
  const totalPages = Math.ceil(suppliers.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedSuppliers = suppliers.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className={styles.pageContainer}>
      <AdminSidebar />

      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Nhà cung cấp</h1>
            <p className={styles.pageSubtitle}>Quản lý nguồn hàng và đối tác</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        <div style={{ marginBottom: '1.5rem' }}>
          <button className={styles.btnPrimary} onClick={handleAddNew}>
            + Thêm Nhà Cung Cấp
          </button>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Tên Đơn Vị</th>
                  <th className={styles.tableHeadCell}>Email</th>
                  <th className={styles.tableHeadCell}>Số Điện Thoại</th>
                  <th className={styles.tableHeadCell}>Hành Động</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {paginatedSuppliers.length > 0 ? paginatedSuppliers.map(s => (
                  <tr key={s._id}>
                    <td className={styles.tableCell}><strong>{s.name}</strong></td>
                    <td className={styles.tableCell}>{s.email || '--'}</td>
                    <td className={styles.tableCell}>{s.phone || '--'}</td>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={`${styles.btnSmall} ${styles.btnEdit}`} onClick={() => handleEdit(s)}>Sửa</button>
                        <button className={`${styles.btnSmall} ${styles.btnDelete}`} onClick={() => handleDelete(s._id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className={styles.noData}>Chưa có nhà cung cấp nào</td></tr>
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
                <h2 className={styles.modalTitle}>{isEditMode ? 'Sửa Đối Tác' : 'Thêm Nhà Cung Cấp'}</h2>
                <button className={styles.modalCloseBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tên Nhà Cung Cấp *</label>
                  <input type="text" className={styles.formInput} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Số Điện Thoại</label>
                  <input type="text" className={styles.formInput} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Địa Chỉ</label>
                  <textarea className={styles.formInput} rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
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