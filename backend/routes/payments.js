const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const uploadPayment = require('../middleware/uploadPayment');

// Stripe checkout (existing)
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Upload payment proof screenshot (guests don't need to be logged in)
router.post(
  '/:bookingId/upload-proof',
  uploadPayment.single('paymentProof'),
  paymentController.uploadPaymentProof
);

// Staff: approve or reject payment proof
router.put(
  '/:bookingId/verify-proof',
  authenticateToken,
  authorizeRole(['admin', 'manager', 'receptionist']),
  paymentController.verifyPaymentProof
);

module.exports = router;
