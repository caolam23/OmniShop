import styles from './ProductManagement.module.css';

export default function ProductTable({
  loading,
  products,
  handleEdit,
  handleDelete
}) {
  if (loading) {
    return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;
  }

  return (
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
                {/* Gạch ngang nếu SP bị xóa mềm */}
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
                  <button className={styles.btnSmall} style={{ backgroundColor: '#3b82f6', color: 'white' }} onClick={() => handleEdit(p)}>Sửa</button>
                  <button className={styles.btnSmall} style={{ backgroundColor: '#ef4444', color: 'white' }} onClick={() => handleDelete(p._id)}>Xóa</button>
                </div>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="6" className={styles.noData}>Không tìm thấy sản phẩm nào</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}