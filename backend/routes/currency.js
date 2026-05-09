const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const currencyController = require('../controllers/currencyController');

// Get exchange rates (public)
router.get('/rates', currencyController.getExchangeRates);

// Convert price (public)
router.post('/convert', currencyController.convertPrice);

// Update exchange rates (admin only)
router.post('/rates/update', authenticateToken, authorizeRole(['admin']), currencyController.updateExchangeRates);

module.exports = router;