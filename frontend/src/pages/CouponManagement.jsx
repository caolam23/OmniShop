import React, { useState, useEffect } from 'react';
import couponApi from '../api/couponApi';
import AdminSidebar from '../components/AdminSidebar';
import styles from './CouponManagement.module.css';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'fixed',
    discountValue: 0,
    minOrderValue: 0,
    expiryDate: '',
    usageLimit: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await couponApi.getAll();
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await couponApi.update(editingCoupon._id, formData);
      } else {
        await couponApi.create(formData);
      }
      setShowModal(false);
      fetchCoupons();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi lưu mã');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã này?')) return;
    try {
      await couponApi.delete(id);
      fetchCoupons();
    } catch (err) {
      alert('Lỗi khi xóa');
    }
  };

  const resetForm = () => {
    setFormData({ code: '', description: '', discountType: 'fixed', discountValue: 0, minOrderValue: 0, expiryDate: '', usageLimit: '', isActive: true });
    setEditingCoupon(null);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      ...coupon,
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  return (
    <div className={styles.pageContainer}>
      <AdminSidebar />

      <div className={styles.mainContent}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Quản lý Mã giảm giá</h1>
            <p className={styles.pageSubtitle}>Tạo và quản lý các chương trình khuyến mãi</p>
          </div>
          <button className={styles.btnPrimary} onClick={() => { resetForm(); setShowModal(true); }}>
            + Thêm mã mới
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCell}>Code</th>
                <th className={styles.tableHeadCell}>Giảm giá</th>
                <th className={styles.tableHeadCell}>Đơn tối thiểu</th>
                <th className={styles.tableHeadCell}>Hạn dùng</th>
                <th className={styles.tableHeadCell}>Trạng thái</th>
                <th className={styles.tableHeadCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {coupons.map(c => (
                <tr key={c._id}>
                  <td className={styles.tableCell}><strong>{c.code}</strong></td>
                  <td className={styles.tableCell}>
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(c.discountValue)}đ`}
                  </td>
                  <td className={styles.tableCell}>{new Intl.NumberFormat('vi-VN').format(c.minOrderValue)}đ</td>
                  <td className={styles.tableCell}>{new Date(c.expiryDate).toLocaleDateString('vi-VN')}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${c.isActive ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {c.isActive ? 'Đang chạy' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <button className={styles.btnSmall} onClick={() => openEdit(c)}>Sửa</button>
                    <button className={`${styles.btnSmall} ${styles.btnDelete}`} onClick={() => handleDelete(c._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div className={`${styles.modal} ${styles.show}`}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingCoupon ? 'Cập nhật mã' : 'Thêm mã giảm giá'}</h2>
              <button onClick={() => setShowModal(false)} className={styles.modalCloseBtn}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mã giảm giá (VD: HELLO2024)</label>
                <input className={styles.formInput} required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
              </div>
              <div className={styles.formRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Loại giảm giá</label>
                  <select className={styles.formInput} value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}>
                    <option value="fixed">Số tiền cố định (đ)</option>
                    <option value="percentage">Phần trăm (%)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Giá trị giảm</label>
                  <input type="number" className={styles.formInput} required value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Giá trị đơn hàng tối thiểu</label>
                <input type="number" className={styles.formInput} value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ngày hết hạn</label>
                <input type="date" className={styles.formInput} required value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                <label>Kích hoạt mã này ngay lập tức</label>
              </div>
            </form>
            <div className={styles.modalFooter}>
              <button className={styles.modalFooterBtnCancel} onClick={() => setShowModal(false)}>Hủy</button>
              <button className={styles.modalFooterBtnSubmit} onClick={handleSubmit}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}