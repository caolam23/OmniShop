const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Tạo file Excel sample có dữ liệu hợp lệ
async function createSampleExcelFile() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  // Thêm header với định dạng
  worksheet.columns = [
    { header: 'Tên sản phẩm *', key: 'name', width: 25 },
    { header: 'Mô tả *', key: 'description', width: 40 },
    { header: 'Giá bán *', key: 'price', width: 12 },
    { header: 'Số lượng *', key: 'quantity', width: 12 },
    { header: 'Danh mục (ID)', key: 'category', width: 25 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Chiết khấu (%)', key: 'discount', width: 15 },
    { header: 'Hoạt động (true/false)', key: 'active', width: 18 }
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };

  // Thêm dữ liệu mẫu - Dữ liệu này HỢPỆ LỆ 100%
  const sampleData = [
    {
      name: 'Áo thun nam cotton',
      description: 'Áo thun nam 100% cotton cao cấp, thoáng mát',
      price: 129000,
      quantity: 100,
      category: '',
      sku: 'AOTHUN-001',
      discount: 10,
      active: 'true'
    },
    {
      name: 'Quần jean nam',
      description: 'Quần jean nam chất liệu tốt, bền bỉ',
      price: 299000,
      quantity: 50,
      category: '',
      sku: 'JEAN-001',
      discount: 5,
      active: 'true'
    },
    {
      name: 'Giày thể thao nam',
      description: 'Giày thể thao nam đế cao su chống trơn',
      price: 399000,
      quantity: 30,
      category: '',
      sku: 'GIAY-001',
      discount: 15,
      active: 'true'
    },
    {
      name: 'Áo khoác nam',
      description: 'Áo khoác nam chống nước, ấm áp',
      price: 599000,
      quantity: 25,
      category: '',
      sku: 'AOKHOAC-001',
      discount: 20,
      active: 'true'
    },
    {
      name: 'Mũ nam thời trang',
      description: 'Mũ nam phong cách, chống nắng',
      price: 79000,
      quantity: 150,
      category: '',
      sku: 'MU-001',
      discount: 0,
      active: 'true'
    },
    {
      name: 'Túi xách nam',
      description: 'Túi xách nam da thật, tinh tế',
      price: 449000,
      quantity: 20,
      category: '',
      sku: 'TUI-001',
      discount: 25,
      active: 'true'
    },
    {
      name: 'Tất nam cotton',
      description: 'Tất nam cotton thoáng khí, trong suốt',
      price: 29000,
      quantity: 500,
      category: '',
      sku: 'TAT-001',
      discount: 0,
      active: 'true'
    },
    {
      name: 'Dây lưng nam',
      description: 'Dây lưng nam da thật, sang trọng',
      price: 149000,
      quantity: 80,
      category: '',
      sku: 'DAY-001',
      discount: 10,
      active: 'true'
    },
    {
      name: 'Ví nam da',
      description: 'Ví nam da cao cấp, bền lâu',
      price: 199000,
      quantity: 60,
      category: '',
      sku: 'VI-001',
      discount: 15,
      active: 'true'
    },
    {
      name: 'Đồng hồ nam',
      description: 'Đồng hồ nam thời trang, chính xác',
      price: 899000,
      quantity: 40,
      category: '',
      sku: 'DONG-001',
      discount: 30,
      active: 'true'
    }
  ];

  // Thêm từng hàng dữ liệu
  sampleData.forEach((item, index) => {
    const row = worksheet.addRow(item);
    // Style cho data rows
    row.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
  });

  // Thêm sheet instructions
  const instructionSheet = workbook.addWorksheet('Hướng dẫn');
  instructionSheet.columns = [
    { header: 'Trường', key: 'field', width: 20 },
    { header: 'Yêu cầu', key: 'requirement', width: 50 }
  ];

  instructionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  instructionSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };

  const instructions = [
    { field: 'Tên sản phẩm *', requirement: 'Bắt buộc, tối đa 255 ký tự' },
    { field: 'Mô tả *', requirement: 'Bắt buộc, 1-1000 ký tự' },
    { field: 'Giá bán *', requirement: 'Bắt buộc, phải > 0' },
    { field: 'Số lượng *', requirement: 'Bắt buộc, phải >= 0, số nguyên' },
    { field: 'Danh mục', requirement: 'Tùy chọn, nhập ID hoặc để trống' },
    { field: 'SKU', requirement: 'Tùy chọn, còn tự sinh nếu để trống' },
    { field: 'Chiết khấu', requirement: 'Tùy chọn, 0-100 (%)' },
    { field: 'Hoạt động', requirement: 'Tùy chọn, true hoặc false (mặc định: true)' }
  ];

  instructions.forEach(inst => {
    instructionSheet.addRow(inst);
  });

  // Lưu file
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, 'sample_products.xlsx');
  await workbook.xlsx.writeFile(filePath);

  console.log(`✅ Sample Excel file tạo thành công: ${filePath}`);
  return filePath;
}

// Chạy nếu file này được gọi trực tiếp
if (require.main === module) {
  createSampleExcelFile().then(() => {
    console.log('✅ Hoàn tất! File sample_products.xlsx đã được tạo');
  }).catch(error => {
    console.error('❌ Lỗi:', error);
  });
}

module.exports = createSampleExcelFile;
