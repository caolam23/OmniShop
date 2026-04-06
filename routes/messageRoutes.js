const express = require('express');
const router = express.Router();
const { getMessages, getChatRooms } = require('../controllers/messageController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/rooms/latest', verifyToken, checkRole(['Admin', 'Staff']), getChatRooms);
router.get('/:room', verifyToken, getMessages);

module.exports = router;
