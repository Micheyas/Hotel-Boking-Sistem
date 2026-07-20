const express = require('express');
const router  = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const serviceController = require('../controllers/serviceController');

// Public — active services visible to all guests
router.get('/',            serviceController.getPublicServices);
router.get('/categories',  serviceController.getCategories);

// Staff — all services including inactive (admin, manager, receptionist)
router.get('/all', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), serviceController.getAllServices);

// Admin / Manager — full CRUD
router.post('/',    authenticateToken, authorizeRole(['admin', 'manager']), serviceController.createService);
router.put('/:id',  authenticateToken, authorizeRole(['admin', 'manager']), serviceController.updateService);
router.delete('/:id', authenticateToken, authorizeRole(['admin']),          serviceController.deleteService);

module.exports = router;
