import styles from './ProductManagement.module.css';

export default function ProductModal({
  show,
  isEditMode,
  formData,
  setFormData,
  categories,
  suppliers,
  imagePreview,
  handleFileChange,
  onSubmit,
  onClose
}) {
  if (!show) return null;
  
  return (
    <div className={`${styles.modal} ${styles.show}`}>
      <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEditMode ? 'Sửa Sản Phẩm' : 'Thêm Sản Phẩm'}</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Cột trái */}
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên Sản Phẩm *</label>
                <input 
                  type="text" className={styles.formInput} 
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Giá (VNĐ) *</label>
                <input 
                  type="number" className={styles.formInput} 
                  value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} 
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số lượng Tồn kho *</label>
                <input 
                  type="number" className={styles.formInput} 
                  value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                />
              </div>
            </div>

            {/* Cột phải */}
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Danh Mục</label>
                <select className={styles.formInput} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nhà Cung Cấp</label>
                <select className={styles.formInput} value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })}>
                  <option value="">-- Chọn NCC --</option>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Hình Ảnh</label>
                <input type="file" accept="image/*" className={styles.formInput} onChange={handleFileChange} />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ marginTop: '0.5rem', width: '100%', height: '100px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mô Tả</label>
            <textarea 
              className={styles.formInput} rows="3" 
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={`${styles.modalFooterBtn} ${styles.modalFooterBtnCancel}`} onClick={onClose}>Hủy</button>
          <button className={`${styles.modalFooterBtn} ${styles.modalFooterBtnSubmit}`} onClick={onSubmit}>Lưu</button>
        </div>
      </div>
    </div>
  );
}