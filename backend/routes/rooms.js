const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const roomController = require('../controllers/roomController');

// Public routes
router.get('/types', roomController.getAllRoomTypes);
router.get('/available', roomController.getAvailableRooms);

// Protected routes (admin/manager)
router.post('/types', authenticateToken, authorizeRole(['admin', 'manager']), roomController.createRoomType);
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), roomController.createRoom);
router.put('/:roomId/status', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), roomController.updateRoomStatus);
router.get('/', authenticateToken, roomController.getAllRooms);

module.exports = router;