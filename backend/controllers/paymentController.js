const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const path = require('path');
const Booking = require('../models/Booking');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, roomType, customerEmail } = req.body;
    if (!amount || !roomType || !customerEmail) {
      return res.status(400).json({ error: 'amount, roomType, and customerEmail are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Room booking: ${roomType}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload payment proof screenshot for a booking
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the booking owner (or guest by bookingId) can upload proof
    // For guest bookings there is no userId, so we allow by bookingId alone
    if (booking.userId && req.user && booking.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const imagePath = '/uploads/payments/' + req.file.filename;
    await booking.update({
      paymentProof: imagePath,
      paymentStatus: 'proof_submitted',
    });

    res.json({
      message: 'Payment proof uploaded successfully. Staff will verify shortly.',
      paymentProof: imagePath,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Staff verifies payment proof and confirms booking
exports.verifyPaymentProof = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (action === 'approve') {
      await booking.update({ paymentStatus: 'verified', status: 'confirmed' });
      return res.json({ message: 'Payment verified and booking confirmed', booking });
    } else if (action === 'reject') {
      await booking.update({ paymentStatus: 'unpaid', paymentProof: null });
      return res.json({ message: 'Payment proof rejected', booking });
    } else {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
