const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All role routes are protected
router.use(verifyToken);

// Get all roles & Get role by ID
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);

// Admin only routes
router.post('/', checkRole(['Admin']), roleController.createRole);
router.put('/:id', checkRole(['Admin']), roleController.updateRole);
router.delete('/:id', checkRole(['Admin']), roleController.deleteRole);
router.delete('/:id/force', checkRole(['Admin']), roleController.forceDeleteRole);
router.patch('/:id/restore', checkRole(['Admin']), roleController.restoreRole);

module.exports = router;
