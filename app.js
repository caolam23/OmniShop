// Load biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');

// Import Config & Middlewares
const connectDB = require('./config/db');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const cartsRoutes = require('./routes/carts');
const suppliersRoutes = require('./routes/suppliers');
const messagesRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/upload');
const ordersRoutes = require('./routes/orders');
const couponsRoutes = require('./routes/coupons');

const app = express();

// =========================
// KẾT NỐI DATABASE
// =========================
connectDB();

// =========================
// MIDDLEWARE CHÍNH
// =========================

// CORS - Cho phép Frontend gọi API
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Thay * bằng URL frontend trong production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logger HTTP requests
app.use(morgan('dev'));

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Phục vụ static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================
// ROUTES
// =========================

// Auth routes
app.use('/api/v1/auth', authRoutes);

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/carts', cartsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/coupons', couponsRoutes);

// API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// =========================
// 404 NOT FOUND HANDLER
// =========================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// =========================
// ERROR HANDLER (Phải để cuối cùng)
// =========================
app.use(errorMiddleware);

module.exports = app;
