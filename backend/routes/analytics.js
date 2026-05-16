const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), analyticsController.getAnalytics);

module.exports = router;