const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   POST /api/v1/auth/register
// @desc    Đăng ký tài khoản
router.post('/register', authController.register);

// @route   POST /api/v1/auth/login
// @desc    Đăng nhập
router.post('/login', authController.login);

// @route   GET /api/v1/auth/me
// @desc    Lấy thông tin user hiện tại (yêu cầu token)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
