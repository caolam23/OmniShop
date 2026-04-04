const Role = require('../models/Role');

// @route   GET /api/v1/roles
// @desc    Lấy danh sách roles
// @access  Private
exports.getAllRoles = async (req, res, next) => {
  try {
    const { includeDeleted = false } = req.query;

    const query = {};
    if (!includeDeleted) {
      query.isDeleted = false;
    }

    const roles = await Role.find(query).select('+isDeleted').sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/roles/:id
// @desc    Lấy chi tiết role
// @access  Private
exports.getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id).select('+isDeleted');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/roles
// @desc    Tạo role mới
// @access  Private/Admin
exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required',
      });
    }

    // Check if role exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: `Role '${name}' already exists`,
      });
    }

    const role = new Role({
      name,
      description: description || '',
      permissions: permissions || [],
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/roles/:id
// @desc    Cập nhật role
// @access  Private/Admin
exports.updateRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/roles/:id
// @desc    Xóa role (soft delete)
// @access  Private/Admin
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    ).select('+isDeleted');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/v1/roles/:id/force
// @desc    Xóa role vĩnh viễn (hard delete)
// @access  Private/Admin
exports.forceDeleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role permanently deleted',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/v1/roles/:id/restore
// @desc    Khôi phục role bị xóa mềm
// @access  Private/Admin
exports.restoreRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    ).select('+isDeleted');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Role restored successfully',
      data: role,
    });
  } catch (error) {
    next(error);
  }
};
