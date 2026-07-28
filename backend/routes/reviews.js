const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Public — anyone can read reviews and the hotel summary
router.get('/', reviewController.getReviews);
router.get('/summary', reviewController.getHotelSummary);

// Authenticated — logged-in customers can submit reviews
router.post('/', authenticateToken, reviewController.createReview);

// Staff only — full list + delete
router.get('/all', authenticateToken, authorizeRole(['admin', 'manager']), reviewController.getAllReviews);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'manager']), reviewController.deleteReview);

module.exports = router;
