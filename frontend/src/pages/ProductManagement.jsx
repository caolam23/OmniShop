import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import categoryApi from '../api/categoryApi';
import supplierApi from '../api/supplierApi';
import authApi from '../api/authApi';
import AdminSidebar from '../components/AdminSidebar';
import styles from './ProductManagement.module.css';

export default function ProductManagement() {
  const navigate = useNavigate();
  
  // States dữ liệu
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // States UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // States Query Params (Phân trang, Tìm kiếm, Sắp xếp)
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // States Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    supplier: '',
    image: null, // Sẽ chứa File object khi upload
  });
  const [imagePreview, setImagePreview] = useState(null); // URL để preview ảnh

  // 1. Fetch Categories & Suppliers khi load trang
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          categoryApi.getAllCategories(),
          supplierApi.getAllSuppliers()
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (supRes.success) setSuppliers(supRes.data);
      } catch (err) {
        console.error('Lỗi khi tải danh mục/nhà cung cấp:', err);
      }
    };
    fetchDropdownData();
  }, []);

  // 2. Fetch Products với Debounce Search (Chờ 500ms sau khi ngừng gõ mới gọi API)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, limit, search, sortBy, sortOrder]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page: currentPage, limit, search, sortBy, sortOrder };
      const response = await productApi.getAllProducts(params);
      
      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        setError(response.message || 'Không thể tải danh sách sản phẩm');
      }
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý mở Modal
  const handleAddNew = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '', price: '', stock: '', category: '', supplier: '', image: null });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setIsEditMode(true);
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category?._id || '',
      supplier: product.supplier?._id || '',
      image: null, // Không load file cũ vào input file được, chỉ preview
    });
    setImagePreview(product.image ? `http://localhost:3000${product.image}` : null);
    setShowModal(true);
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file)); // Preview ảnh ngay lập tức
    }
  };

  // Xử lý Submit Form (Có file ảnh -> Dùng FormData)
  const handleSubmit = async () => {
    if (!formData.name || !formData.price || formData.stock === '') {
      setError('Vui lòng điền đầy đủ Tên, Giá và Số lượng');
      return;
    }

    try {
      setError('');
      // Bọc dữ liệu vào FormData
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      if (formData.category) submitData.append('category', formData.category);
      if (formData.supplier) submitData.append('supplier', formData.supplier);
      
      // Chỉ append image nếu người dùng có chọn file mới
      if (formData.image instanceof File) {
        submitData.append('image', formData.image);
      }

      let response;
      if (isEditMode) {
        response = await productApi.updateProduct(selectedProduct._id, submitData);
      } else {
        response = await productApi.createProduct(submitData);
      }

      if (response.success) {
        setSuccess(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!');
        setShowModal(false);
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
  };

  // Xóa mềm sản phẩm
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await productApi.deleteProduct(id);
        if (response.success) {
          setSuccess('Đã xóa sản phẩm!');
          fetchProducts(); // Refresh danh sách (API backend sẽ tự ẩn sản phẩm isDeleted=true do bạn đã setup)
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

  return (
    <div className={styles.pageContainer}>
      <AdminSidebar />

      <main className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Quản lý Sản phẩm</h1>
            <p className={styles.pageSubtitle}>Quản lý danh sách, tồn kho và hình ảnh sản phẩm</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Đăng xuất</button>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {/* Toolbar: Tìm kiếm, Sắp xếp, Lọc */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <button className={styles.btnPrimary} onClick={handleAddNew} style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap' }}>
            + Thêm Sản Phẩm
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Tìm tên hoặc mô tả..."
              className={styles.formInput}
              style={{ width: '250px', height: '42px' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
              }}
            />
            
            <select 
              className={styles.formInput} 
              style={{ height: '42px' }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <option value="createdAt-desc">Mới nhất trước</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="name-asc">Tên: A - Z</option>
              <option value="name-desc">Tên: Z - A</option>
            </select>

            <select 
              className={styles.formInput} 
              style={{ height: '42px' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 mục / trang</option>
              <option value={10}>10 mục / trang</option>
              <option value={20}>20 mục / trang</option>
            </select>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        {loading ? (
          <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th className={styles.tableHeadCell}>Ảnh</th>
                  <th className={styles.tableHeadCell}>Tên SP</th>
                  <th className={styles.tableHeadCell}>Giá</th>
                  <th className={styles.tableHeadCell}>Tồn Kho</th>
                  <th className={styles.tableHeadCell}>Danh Mục</th>
                  <th className={styles.tableHeadCell}>Thao Tác</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {products.length > 0 ? products.map(p => (
                  <tr key={p._id}>
                    <td className={styles.tableCell}>
                      {p.image ? (
                        <img 
                          src={`http://localhost:3000${p.image}`} 
                          alt={p.name} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : (
                        <div style={{ width: '50px', height: '50px', backgroundColor: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Img</div>
                      )}
                    </td>
                    <td className={styles.tableCell}>
                      {/* Gạch ngang nếu SP bị xóa mềm (Dù API của chúng ta đang filter isDeleted: ne true) */}
                      <span style={{ textDecoration: p.isDeleted ? 'line-through' : 'none', fontWeight: 500 }}>
                        {p.name}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={`${styles.badge} ${p.stock > 0 ? styles.badgeSuccess : styles.badgeWarning}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className={styles.tableCell}>{p.category?.name || '--'}</td>
                    <td className={styles.tableCell}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className={styles.btnSmall} 
                          style={{ backgroundColor: '#3b82f6', color: 'white' }}
                          onClick={() => handleEdit(p)}
                        >
                          Sửa
                        </button>
                        <button 
                          className={styles.btnSmall} 
                          style={{ backgroundColor: '#ef4444', color: 'white' }}
                          onClick={() => handleDelete(p._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className={styles.noData}>Không tìm thấy sản phẩm nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <button 
              className={styles.paginationBtn} 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.paginationBtn} ${currentPage === i + 1 ? styles.paginationBtnActive : ''}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button 
              className={styles.paginationBtn} 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        )}

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div className={`${styles.modal} ${styles.show}`}>
            <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>{isEditMode ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}</h2>
                <button className={styles.modalCloseBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Cột trái */}
                  <div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tên Sản Phẩm *</label>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Giá (VNĐ) *</label>
                      <input 
                        type="number" 
                        className={styles.formInput} 
                        value={formData.price} 
                        onChange={e => setFormData({...formData, price: e.target.value})} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Số lượng Tồn kho *</label>
                      <input 
                        type="number" 
                        className={styles.formInput} 
                        value={formData.stock} 
                        onChange={e => setFormData({...formData, stock: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Cột phải */}
                  <div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Danh Mục</label>
                      <select 
                        className={styles.formInput} 
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Nhà Cung Cấp</label>
                      <select 
                        className={styles.formInput} 
                        value={formData.supplier} 
                        onChange={e => setFormData({...formData, supplier: e.target.value})}
                      >
                        <option value="">-- Chọn NCC --</option>
                        {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Hình Ảnh</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className={styles.formInput} 
                        onChange={handleFileChange} 
                      />
                      {imagePreview && (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ marginTop: '0.5rem', width: '100%', height: '100px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} 
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô Tả</label>
                  <textarea 
                    className={styles.formInput} 
                    rows="3" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
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
