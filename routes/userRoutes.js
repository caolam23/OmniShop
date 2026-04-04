const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All user routes are protected
router.use(verifyToken);

// Get all users & Get user by ID
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// Admin only routes
router.post('/', checkRole(['Admin']), userController.createUser);
router.put('/:id', checkRole(['Admin']), userController.updateUser);
router.delete('/:id', checkRole(['Admin']), userController.deleteUser);
router.delete('/:id/force', checkRole(['Admin']), userController.forceDeleteUser);
router.patch('/:id/restore', checkRole(['Admin']), userController.restoreUser);

module.exports = router;
