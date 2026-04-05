const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');

// Hàm tạo JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @route   POST /api/v1/auth/register
// @desc    Đăng ký tài khoản mới
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Xác định role dựa trên email (Tự động cấp Admin cho admin@omnishop.com)
    let roleName = email === 'admin@omnishop.com' ? 'Admin' : 'User';
    let userRole = await Role.findOne({ name: roleName });
    
    // Nếu không tìm thấy role, tạo nó
    if (!userRole) {
      if (roleName === 'Admin') {
        userRole = new Role({
          name: 'Admin',
          description: 'Quản trị viên hệ thống',
          permissions: ['*'],
        });
      } else {
        userRole = new Role({
          name: 'User',
          description: 'Regular User - Can browse and purchase',
          permissions: ['products:read', 'carts:manage', 'orders:create'],
        });
      }
      await userRole.save();
    }

    // Tạo user mới
    const user = new User({ 
      username, 
      email, 
      password,
      role: userRole._id,
    });
    await user.save();

    // Populate role field để return đầy đủ info
    await user.populate('role');

    // Tạo token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/auth/login
// @desc    Đăng nhập
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Tìm user (cần select password vì mặc định không trả về)
    const user = await User.findOne({ email, isDeleted: false })
      .select('+password')
      .populate('role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // So sánh password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Tạo token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/auth/me
// @desc    Lấy thông tin user hiện tại (yêu cầu token)
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user được set bởi verifyToken middleware
    const user = await User.findById(req.user._id).populate('role').select('-password -isDeleted');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
