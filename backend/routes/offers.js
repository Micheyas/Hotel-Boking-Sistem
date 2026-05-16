const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const offerController = require('../controllers/offerController');

// Get active offers (public)
router.get('/active', offerController.getActiveOffers);

// Calculate discount
router.post('/calculate-discount', offerController.calculateDiscount);

// Get all offers (admin/manager/receptionist)
router.get('/', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), offerController.getAllOffers);

// Create offer (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), offerController.createOffer);

// Update offer status (admin only)
router.put('/:offerId/status', authenticateToken, authorizeRole(['admin']), offerController.updateOfferStatus);

module.exports = router;