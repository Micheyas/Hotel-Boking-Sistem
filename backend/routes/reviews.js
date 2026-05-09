const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

router.get('/', reviewController.getReviews);
router.post('/', authenticateToken, reviewController.createReview);
router.get('/all', authenticateToken, authorizeRole(['admin', 'manager']), reviewController.getAllReviews);

module.exports = router;