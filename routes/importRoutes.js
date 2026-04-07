const express = require('express');
const router = express.Router();
const excelUpload = require('../middlewares/excelUploadMiddleware');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const importController = require('../controllers/importController');

// ================================
// EXCEL IMPORT ROUTES
// ================================

// @route   POST /api/v1/import/upload-excel
// @desc    Tải lên file Excel để nhập liệu sản phẩm hàng loạt
// @access  Private (Admin/Supplier)
router.post(
  '/upload-excel',
  authenticate,
  authorize(['admin', 'supplier']),
  excelUpload.single('file'),
  importController.uploadExcel
);

// @route   POST /api/v1/import/confirm-import
// @desc    Xác nhận nhập liệu sản phẩm từ Excel
// @access  Private (Admin/Supplier)
router.post(
  '/confirm-import',
  authenticate,
  authorize(['admin', 'supplier']),
  importController.confirmImport
);

// @route   GET /api/v1/import/template
// @desc    Tải về template Excel để nhập liệu sản phẩm
// @access  Public
router.get('/template', importController.downloadTemplate);

// ================================
// HEALTH CHECK ROUTES
// ================================

// @route   GET /api/v1/health
// @desc    Kiểm tra trạng thái API cơ bản
// @access  Public
router.get('/health', importController.healthCheck);

// @route   GET /api/v1/health/detailed
// @desc    Kiểm tra chi tiết trạng thái tất cả components
// @access  Private (Admin)
router.get(
  '/health/detailed',
  authenticate,
  authorize(['admin']),
  importController.healthCheckDetailed
);

module.exports = router;
