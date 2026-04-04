const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// All user routes are protected
router.use(verifyToken);

// Admin only routes - Get all users & Get user by ID
router.get('/', checkRole(['Admin']), userController.getAllUsers);
router.get('/:id', checkRole(['Admin']), userController.getUserById);

// Admin only routes - Create, Update, Delete
router.post('/', checkRole(['Admin']), userController.createUser);
router.put('/:id', checkRole(['Admin']), userController.updateUser);
router.delete('/:id', checkRole(['Admin']), userController.deleteUser);
router.delete('/:id/force', checkRole(['Admin']), userController.forceDeleteUser);
router.patch('/:id/restore', checkRole(['Admin']), userController.restoreUser);

module.exports = router;
