const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Create booking (online booking) - for logged-in customers
router.post('/', authenticateToken, authorizeRole(['customer']), bookingController.createBooking);

// Create guest booking (no login required)
router.post('/guest', bookingController.createGuestBooking);

// Create manual booking (receptionist walk-in / phone) — receptionist, admin, manager
router.post('/manual', authenticateToken, authorizeRole(['receptionist', 'admin', 'manager']), bookingController.createManualBooking);

// Get user's bookings
router.get('/my-bookings', authenticateToken, bookingController.getUserBookings);

// Get all bookings (admin/manager/receptionist)
router.get('/', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), bookingController.getAllBookings);

// Update booking status — REMOVED (no longer exposed)
// router.put('/:bookingId/status', ...)

// Cancel booking
router.put('/:bookingId/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;