import styles from './ProductManagement.module.css';

export default function ProductTable({
  loading,
  products,
  handleEdit,
  handleDelete,
  handleRestore
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
            <tr key={p._id} className={p.isDeleted ? styles.deletedRow : ''}>
              <td className={`${styles.tableCell} ${p.isDeleted ? styles.tableCellDeleted : ''}`}>
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
              <td className={`${styles.tableCell} ${p.isDeleted ? styles.tableCellDeleted : ''}`}>
                {/* Gạch ngang nếu SP bị xóa mềm */}
                <span style={{ textDecoration: p.isDeleted ? 'line-through' : 'none', fontWeight: 500 }}>
                  {p.name}
                </span>
              </td>
              <td className={`${styles.tableCell} ${p.isDeleted ? styles.tableCellDeleted : ''}`}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
              </td>
              <td className={styles.tableCell}>
                {p.isDeleted ? (
                  <span className={`${styles.badge} ${styles.badgeDanger}`}>Đã xóa</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                    <span className={`${styles.badge} ${(p.stock - (p.reserved || 0)) > 0 ? styles.badgeSuccess : styles.badgeWarning}`}>
                      Còn lại: {(p.stock - (p.reserved || 0))}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      Tổng: {p.stock} | Đã bán: {p.soldCount || 0}
                    </span>
                    {(p.reserved || 0) > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                        (Đang giữ: {p.reserved})
                      </span>
                    )}
                  </div>
                )}
              </td>
              <td className={`${styles.tableCell} ${p.isDeleted ? styles.tableCellDeleted : ''}`}>{p.category?.name || '--'}</td>
              <td className={styles.tableCell}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.isDeleted ? (
                    <button className={`${styles.btnSmall} ${styles.btnRestore}`} onClick={() => handleRestore(p._id)}>Khôi phục</button>
                  ) : (
                    <>
                      <button className={`${styles.btnSmall} ${styles.btnEdit}`} onClick={() => handleEdit(p)}>Sửa</button>
                      <button className={`${styles.btnSmall} ${styles.btnDelete}`} onClick={() => handleDelete(p._id)}>Xóa</button>
                    </>
                  )}
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