const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get available staff/admin for customer to chat with
router.get('/staff', verifyToken, messageController.getStaffForChat);

// Get list of conversations (for Staff/Admin panel)
router.get('/conversations', verifyToken, messageController.getConversations);

// Get chat history with a specific user
router.get('/:userId', verifyToken, messageController.getChatHistory);

module.exports = router;
