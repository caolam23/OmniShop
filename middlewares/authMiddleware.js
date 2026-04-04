const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Middleware xác thực JWT - Lấy user từ token
exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    // Lấy user từ database
    const user = await User.findById(decoded.id).select('+isDeleted').populate('role');
    
    if (!user || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deleted',
      });
    }

    req.user = user;
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

// Middleware phân quyền - Kiểm tra role của user
exports.checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Lấy tên role của user
      const userRole = req.user.role?.name;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Only ${allowedRoles.join(', ')} can access this resource`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking role',
      });
    }
  };
};

module.exports = exports;
