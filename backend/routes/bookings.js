const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Create booking (online booking) - for logged-in customers
router.post('/', authenticateToken, authorizeRole(['customer']), bookingController.createBooking);

// Create guest booking (no login required)
router.post('/guest', bookingController.createGuestBooking);

// Get user's bookings
router.get('/my-bookings', authenticateToken, bookingController.getUserBookings);

// Get all bookings (admin/manager)
router.get('/', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), bookingController.getAllBookings);

// Update booking status
router.put('/:bookingId/status', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), bookingController.updateBookingStatus);

// Cancel booking
router.put('/:bookingId/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;