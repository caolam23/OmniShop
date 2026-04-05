const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Using the correct checkLogin or checkToken middleware (will be adjusted after verifying what's used in the app)
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, notificationController.getNotifications);
router.patch('/:id/read', verifyToken, notificationController.markAsRead);

module.exports = router;
