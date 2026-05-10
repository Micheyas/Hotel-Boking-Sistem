const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const roomController = require('../controllers/roomController');
const upload = require('../middleware/upload');

// Public: all rooms with type info (for the public rooms page)
router.get('/public', roomController.getAllRoomsPublic);
router.get('/types', roomController.getAllRoomTypes);
router.get('/check-availability', roomController.checkAvailability);
router.get('/available', roomController.getAvailableRooms);

// Protected routes (admin/manager only)
router.post('/types', authenticateToken, authorizeRole(['admin', 'manager']), roomController.createRoomType);
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('image'), roomController.createRoom);
router.put('/:roomId/status', authenticateToken, authorizeRole(['admin', 'manager']), roomController.updateRoomStatus);
router.put('/:roomId', authenticateToken, authorizeRole(['admin', 'manager']), upload.single('image'), roomController.updateRoom);
router.delete('/:roomId', authenticateToken, authorizeRole(['admin', 'manager']), roomController.deleteRoom);
router.get('/', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), roomController.getAllRooms);

module.exports = router;
