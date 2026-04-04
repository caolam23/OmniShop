const User = require('../models/User');
const Role = require('../models/Role');

// @route   GET /api/v1/users
// @desc    Lấy danh sách users (kể cả deleted)
// @access  Private
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', includeDeleted = false } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Lấy tổng số users
    const total = await User.countDocuments(query);

    // Lấy users
    const users = await User.find(query)
      .select('+isDeleted')
      .populate('role', 'name description')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/users/:id
// @desc    Lấy chi tiết user
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('+isDeleted')
      .populate('role', 'name description');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/users
// @desc    Tạo user mới
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, roleId } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Check role exists
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role not found',
        });
      }
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      role: roleId || null,
    });

    await user.save();
    await user.populate('role', 'name description');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/users/:id
// @desc    Cập nhật user
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { username, email, roleId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check role exists nếu cập nhật role
    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role not found',
        });
      }
      user.role = roleId;
    }

    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    await user.populate('role', 'name description');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/users/:id
// @desc    Xóa user (soft delete)
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    ).select('+isDeleted');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/users/:id/force
// @desc    Xóa user vĩnh viễn (hard delete)
// @access  Private/Admin
exports.forceDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User permanently deleted',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/users/:id/restore
// @desc    Khôi phục user bị xóa mềm
// @access  Private/Admin
exports.restoreUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    ).select('+isDeleted');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
