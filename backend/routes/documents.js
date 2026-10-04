// ── Staff-only signed URLs for sensitive Cloudinary documents ───────────────
// Payment proofs (Booking.paymentProof) and KYC ID images (User.idFront /
// User.idBack) are uploaded to Cloudinary with `type: 'authenticated'`, so
// their raw delivery URLs return 401. Staff view these documents through this
// endpoint, which mints a short-lived signed URL after verifying:
//   1. the requester is staff (admin / manager / receptionist), and
//   2. the document actually belongs to the booking/user record in our DB.
// Clients never supply a public_id — the server resolves it from the record.

const express = require('express');
const cloudinary = require('cloudinary').v2;
const { Booking, User } = require('../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

const SIGNED_URL_TTL_SECONDS = 10 * 60; // signed URLs live 10 minutes
const STAFF_ROLES = ['admin', 'manager', 'receptionist'];

// Defense in depth: even though public_ids are resolved from DB records (never
// from client input), refuse to sign anything outside the sensitive folders.
const ALLOWED_FOLDERS = ['hotel-payments', 'hotel-kyc'];

// Extract the public_id from a Cloudinary delivery URL. Handles:
//   https://res.cloudinary.com/<cloud>/image/upload/v1234/hotel-payments/payment-1.jpg
//   https://res.cloudinary.com/<cloud>/image/authenticated/s--sig--/v1234/hotel-kyc/kyc-1.png
//   https://res.cloudinary.com/<cloud>/image/authenticated/hotel-kyc/kyc-1
function publicIdFromUrl(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const m = url.match(/\/image\/(?:upload|authenticated)\/(.+)$/);
  if (!m) return null;
  const rest = m[1]
    .replace(/^s--[A-Za-z0-9_-]+--\//, '') // signed-URL prefix
    .replace(/^v\d+\//, '')                 // version prefix
    .replace(/\.(jpg|jpeg|png|webp|gif|pdf)$/i, ''); // delivery format suffix
  return decodeURIComponent(rest) || null;
}

// GET /api/staff/documents/signed-url?kind=payment-proof&bookingId=123
// GET /api/staff/documents/signed-url?kind=kyc-front&userId=45
// GET /api/staff/documents/signed-url?kind=kyc-back&userId=45
router.get(
  '/signed-url',
  authenticateToken,
  authorizeRole(STAFF_ROLES),
  async (req, res) => {
    try {
      const { kind, bookingId, userId } = req.query;
      let storedUrl = null;

      if (kind === 'payment-proof') {
        if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });
        const booking = await Booking.findByPk(bookingId, { attributes: ['id', 'paymentProof'] });
        if (!booking || !booking.paymentProof) {
          return res.status(404).json({ error: 'Payment proof not found' });
        }
        storedUrl = booking.paymentProof;
      } else if (kind === 'kyc-front' || kind === 'kyc-back') {
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const field = kind === 'kyc-front' ? 'idFront' : 'idBack';
        const user = await User.findByPk(userId, { attributes: ['id', 'idFront', 'idBack'] });
        if (!user || !user[field]) {
          return res.status(404).json({ error: 'KYC document not found' });
        }
        storedUrl = user[field];
      } else {
        return res.status(400).json({ error: "kind must be 'payment-proof', 'kyc-front' or 'kyc-back'" });
      }

      const publicId = publicIdFromUrl(storedUrl);
      if (!publicId || !ALLOWED_FOLDERS.some((f) => publicId === f || publicId.startsWith(f + '/'))) {
        return res.status(400).json({ error: 'Unrecognized document URL' });
      }

      // Mint a signed URL valid for 10 minutes. `sign_url` is required for
      // `type: 'authenticated'` delivery; `expires_at` makes the URL stop
      // working after the deadline. The frontend re-fetches on any load error,
      // so an expired URL degrades gracefully into a fresh one.
      const expiresAt = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
      const signedUrl = cloudinary.url(publicId, {
        resource_type: 'image',
        type: 'authenticated',
        sign_url: true,
        expires_at: expiresAt,
      });

      res.json({ signedUrl, expiresAt });
    } catch (err) {
      console.error('[documents] signed-url error:', err.message);
      res.status(500).json({ error: 'Could not generate document URL' });
    }
  }
);

module.exports = router;
