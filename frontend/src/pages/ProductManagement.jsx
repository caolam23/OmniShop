import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productApi from '../api/productApi';
import categoryApi from '../api/categoryApi';
import supplierApi from '../api/supplierApi';
import authApi from '../api/authApi';
import AdminSidebar from '../components/AdminSidebar';
import ProductModal from './ProductModal';
import ProductTable from './ProductTable';
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
  
  // States Query Params 
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  // States Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    supplier: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null); // URL để preview ảnh
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, limit, search, sortBy, sortOrder, filterCategory, filterSupplier]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { 
        page: currentPage, 
        limit, 
        search, 
        sortBy, 
        sortOrder,
        includeDeleted: true // Yêu cầu server trả về cả sản phẩm đã xóa mềm
      };
      if (filterCategory) params.category = filterCategory;
      if (filterSupplier) params.supplier = filterSupplier;

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
      image: null, 
    });
    setImagePreview(product.image ? `http://localhost:3000${product.image}` : null);
    setShowModal(true);
  };

  // Xử lý chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file)); 
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
  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const response = await productApi.deleteProduct(productToDelete);
      if (response.success) {
        setSuccess('Đã xóa sản phẩm!');
        fetchProducts(); 
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.message || 'Lỗi khi xóa');
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Khôi phục sản phẩm
  const handleRestore = async (id) => {
    try {
      const response = await productApi.restoreProduct(id);
      if (response.success) {
        setSuccess('Đã khôi phục sản phẩm!');
        fetchProducts(); 
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.message || 'Lỗi khi khôi phục');
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <button className={styles.btnPrimary} onClick={handleAddNew} style={{ height: '42px', padding: '0 1.25rem', whiteSpace: 'nowrap' }}>
            + Thêm Sản Phẩm
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Tìm tên hoặc mô tả..."
              className={styles.formInput}
              style={{ width: '250px', height: '42px' }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1); 
              }}
            />
            
            <select 
              className={styles.formInput} 
              style={{ height: '42px', width: '180px' }}
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>

            <select 
              className={styles.formInput} 
              style={{ height: '42px', width: '180px' }}
              value={filterSupplier}
              onChange={(e) => {
                setFilterSupplier(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả NCC</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

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

        <ProductTable 
          loading={loading} 
          products={products} 
          handleEdit={handleEdit} 
          handleDelete={handleDelete} 
          handleRestore={handleRestore}
        />

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

        <ProductModal
          show={showModal}
          isEditMode={isEditMode}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          suppliers={suppliers}
          imagePreview={imagePreview}
          handleFileChange={handleFileChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />

        {/* Modal Xác nhận xóa */}
        {showDeleteModal && (
          <div onClick={() => setShowDeleteModal(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:'white', borderRadius:'8px', width:'400px', maxWidth:'90vw', padding:'2rem', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', animation: 'modalFadeIn 0.2s ease-out' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h2 style={{ fontSize:'1.25rem', fontWeight:600, color:'#1f2937', marginBottom:'0.5rem', marginTop: 0 }}>Xác nhận xóa</h2>
              <p style={{ color:'#6b7280', marginBottom:'2rem' }}>Bạn có chắc chắn muốn xóa sản phẩm này không?</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => setShowDeleteModal(false)}
                  style={{ flex: 1, background:'#f3f4f6', color:'#374151', border:'none', padding:'0.75rem', borderRadius:'6px', fontWeight:500, cursor:'pointer', transition: 'background 0.2s' }}>
                  Hủy
                </button>
                <button onClick={confirmDelete}
                  style={{ flex: 1, background:'#ef4444', color:'white', border:'none', padding:'0.75rem', borderRadius:'6px', fontWeight:500, cursor:'pointer', transition: 'background 0.2s' }}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
