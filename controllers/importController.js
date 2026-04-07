const Product = require('../models/Product');
const Category = require('../models/Category');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// @route   POST /api/v1/import/upload-excel
// @desc    Tải lên file Excel để nhập liệu sản phẩm hàng loạt
// @access  Private (Admin/Supplier)
exports.uploadExcel = async (req, res, next) => {
  try {
    // Kiểm tra file được upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file Excel để upload'
      });
    }

    const filePath = req.file.path;

    // Đọc file Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet('Products') || workbook.worksheets[0];
    
    if (!worksheet) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'File Excel không chứa dữ liệu hợp lệ'
      });
    }

    const products = [];
    const errors = [];
    let rowIndex = 2; // Bắt đầu từ hàng 2 (hàng 1 là header)

    // Duyệt qua từng hàng
    worksheet.eachRow((row, index) => {
      if (index === 1) return; // Bỏ qua header
      
      const rowData = row.values;
      
      // Validate dữ liệu
      if (!rowData[1] || !rowData[1].trim()) {
        errors.push(`Hàng ${index}: Tên sản phẩm bị trống`);
        return;
      }

      if (!rowData[2] || !rowData[2].trim()) {
        errors.push(`Hàng ${index}: Mô tả bị trống`);
        return;
      }

      if (!rowData[3] || isNaN(parseFloat(rowData[3]))) {
        errors.push(`Hàng ${index}: Giá bán không hợp lệ`);
        return;
      }

      if (!rowData[4] || isNaN(parseInt(rowData[4]))) {
        errors.push(`Hàng ${index}: Số lượng không hợp lệ`);
        return;
      }

      const product = {
        name: rowData[1].trim(),
        description: rowData[2].trim(),
        price: parseFloat(rowData[3]),
        quantity: parseInt(rowData[4]),
        category: rowData[5] || null, // Category có thể để trống
        supplier: req.user?._id || null, // Lấy từ user hiện tại nếu là supplier
        sku: rowData[6]?.trim() || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        discount: parseFloat(rowData[7]) || 0,
        isActive: rowData[8] !== 'false' && rowData[8] !== '0', // Mặc định là active
      };

      // Validate giá và số lượng
      if (product.price < 0) {
        errors.push(`Hàng ${index}: Giá bán không được âm`);
        return;
      }

      if (product.quantity < 0) {
        errors.push(`Hàng ${index}: Số lượng không được âm`);
        return;
      }

      products.push(product);
    });

    // Nếu có lỗi, trả về list lỗi
    if (errors.length > 0 && products.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'File Excel có lỗi dữ liệu',
        errors: errors,
        validRows: 0,
        totalRows: worksheet.rowCount - 1
      });
    }

    // Trả về dữ liệu preview
    res.status(200).json({
      success: true,
      message: 'File Excel được tải lên thành công',
      data: {
        totalRows: worksheet.rowCount - 1,
        validRows: products.length,
        errorRows: errors.length,
        products: products,
        errors: errors,
        fileName: req.file.filename,
        fileSize: req.file.size
      }
    });

  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @route   POST /api/v1/import/confirm-import
// @desc    Xác nhận nhập liệu sản phẩm từ Excel
// @access  Private (Admin/Supplier)
exports.confirmImport = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách sản phẩm không hợp lệ'
      });
    }

    // Cố gắng sử dụng transaction nếu khả dụng (MongoDB replica set)
    // Nếu không, import bình thường (MongoDB standalone)
    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      // Kiểm tra nếu connection hỗ trợ transaction
      if (mongoose.connection.db.serverConfig.isConnected) {
        session.startTransaction();
        useTransaction = true;
      }
    } catch (sessionError) {
      console.warn('⚠️ Transaction không hỗ trợ, import bình thường');
      useTransaction = false;
    }

    try {
      const importedProducts = [];
      const failedProducts = [];

      for (let i = 0; i < products.length; i++) {
        const productData = products[i];

        // Validate category nếu có
        if (productData.category) {
          const category = await Category.findById(productData.category);
          if (!category) {
            failedProducts.push({
              rowIndex: i + 2,
              name: productData.name,
              reason: 'Danh mục không tồn tại'
            });
            continue;
          }
        }

        try {
          // Tạo sản phẩm mới
          const newProduct = new Product({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            discount: productData.discount,
            category: productData.category || null,
            supplier: productData.supplier || req.user._id,
            sku: productData.sku,
            isActive: productData.isActive
          });

          const saveOptions = useTransaction ? { session } : {};
          await newProduct.save(saveOptions);

          // Tạo record inventory
          const Inventory = require('../models/Inventory');
          const inventory = new Inventory({
            product: newProduct._id,
            quantity: productData.quantity,
            reorderLevel: Math.ceil(productData.quantity * 0.2), // 20% của số lượng
            lastRestockDate: new Date()
          });

          await inventory.save(saveOptions);

          importedProducts.push({
            _id: newProduct._id,
            name: newProduct.name,
            quantity: productData.quantity
          });
        } catch (itemError) {
          failedProducts.push({
            rowIndex: i + 2,
            name: productData.name,
            reason: itemError.message
          });
        }
      }

      // Commit transaction nếu đang sử dụng
      if (useTransaction && session) {
        await session.commitTransaction();
      }

      res.status(201).json({
        success: true,
        message: `Nhập liệu ${importedProducts.length} sản phẩm thành công`,
        data: {
          importedCount: importedProducts.length,
          failedCount: failedProducts.length,
          importedProducts: importedProducts,
          failedProducts: failedProducts
        }
      });

    } catch (error) {
      if (useTransaction && session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }

  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/import/template
// @desc    Tải về template Excel để nhập liệu
// @access  Public
exports.downloadTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Thêm header
    worksheet.columns = [
      { header: 'Tên sản phẩm *', key: 'name', width: 25 },
      { header: 'Mô tả *', key: 'description', width: 35 },
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

    // Thêm dòng ví dụ
    worksheet.addRow({
      name: 'Sản phẩm ví dụ',
      description: 'Mô tả sản phẩm ví dụ',
      price: 99999,
      quantity: 100,
      category: '60d5ec49c1234567890abcd1',
      sku: 'SKU001',
      discount: 10,
      active: true
    });

    // Thêm chú thích
    worksheet.addRow({});
    worksheet.addRow({});
    worksheet.addRow({
      name: 'Chú thích:'
    });
    worksheet.addRow({
      name: '- Các trường có dấu * là bắt buộc'
    });
    worksheet.addRow({
      name: '- Giá bán: nhập số lớn hơn 0'
    });
    worksheet.addRow({
      name: '- Số lượng: nhập số nguyên dương'
    });
    worksheet.addRow({
      name: '- Danh mục: nhập ID của danh mục hoặc để trống'
    });
    worksheet.addRow({
      name: '- Hoạt động: nhập true hoặc false (mặc định là true)'
    });

    // Gửi file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Import_Template.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};

// ================================
// HEALTH CHECK API
// ================================

// @route   GET /api/v1/health
// @desc    Kiểm tra trạng thái API và cơ sở dữ liệu
// @access  Public
exports.healthCheck = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: 0,
      checks: {
        api: { status: 'ok', message: 'API server đang chạy' },
        database: { status: 'connecting', message: 'Kiểm tra kết nối database...' },
        memory: { status: 'ok' },
        nodejs: { status: 'ok' }
      }
    };

    // Kiểm tra MongoDB connection
    try {
      const mongooseConnectionState = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongooseConnectionState === 1) {
        healthStatus.checks.database = {
          status: 'ok',
          message: 'Kết nối database thành công',
          connectionState: 'connected'
        };
        
        // Test query
        const count = await Product.countDocuments();
        healthStatus.checks.database.productsCount = count;
      } else {
        healthStatus.checks.database = {
          status: 'warning',
          message: 'Database chưa kết nối',
          connectionState: mongooseConnectionState === 2 ? 'connecting' : 'disconnected'
        };
        healthStatus.status = 'warning';
      }
    } catch (dbError) {
      healthStatus.checks.database = {
        status: 'error',
        message: dbError.message
      };
      healthStatus.status = 'warning';
    }

    // Kiểm tra memory usage
    const memoryUsage = process.memoryUsage();
    healthStatus.checks.memory = {
      status: 'ok',
      message: 'Memory sử dụng',
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    };

    // Kiểm tra Node.js version
    healthStatus.checks.nodejs = {
      status: 'ok',
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };

    healthStatus.responseTime = Date.now() - startTime;

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks: {
        api: { status: 'error', message: 'API server gặp lỗi' }
      }
    });
  }
};

// @route   GET /api/v1/health/detailed
// @desc    Kiểm tra chi tiết trạng thái tất cả components
// @access  Private (Admin)
exports.healthCheckDetailed = async (req, res, next) => {
  try {
    const healthReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || 'unknown'
      },
      server: {
        uptime: process.uptime(),
        pid: process.pid
      },
      database: {},
      collections: {},
      cache: {},
      performance: {}
    };

    // Database info
    try {
      const db = mongoose.connection;
      healthReport.database = {
        state: db.readyState === 1 ? 'connected' : 'disconnected',
        name: db.name,
        host: db.host,
        port: db.port
      };

      // Lấy dữ liệu thống kê từ các collections
      const collections = [
        { model: Product, name: 'Products' },
        { model: Category, name: 'Categories' },
        { model: require('../models/User'), name: 'Users' },
        { model: require('../models/Order'), name: 'Orders' }
      ];

      for (const col of collections) {
        healthReport.collections[col.name] = {
          count: await col.model.countDocuments(),
          indexes: col.model.collection.getIndexes ? Object.keys(await col.model.collection.getIndexes()).length : 0
        };
      }
    } catch (error) {
      healthReport.database.error = error.message;
    }

    // Performance metrics
    healthReport.performance = {
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
      },
      cpu: {
        usage: process.cpuUsage ? process.cpuUsage() : 'N/A'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Health check chi tiết',
      data: healthReport
    });

  } catch (error) {
    next(error);
  }
};
