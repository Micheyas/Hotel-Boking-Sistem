const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../middleware/mailer');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Email is "configured" only when real credentials exist in .env
const EMAIL_CONFIGURED = !!(
  process.env.EMAIL_SERVICE &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_USER !== 'your_email@gmail.com' &&
  process.env.EMAIL_PASS !== 'your_app_password'
);

function makeVerifyToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(user, token) {
  const link = `${FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: '📧 Verify your email — 2RN Solomon Hotel',
    text: `Hi ${user.name},\n\nPlease verify your email:\n${link}\n\nExpires in 24 hours.`,
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:520px;margin:auto;background:#fffdf5;border:1px solid #e2c97e;border-radius:12px;padding:32px;">
        <h2 style="color:#1a1a2e;margin-top:0;">📧 Verify Your Email</h2>
        <p style="color:#333;">Hi <strong>${user.name}</strong>,</p>
        <p style="color:#333;">Click below to activate your account at <strong>2RN Solomon Hotel</strong>. Link expires in 24 hours.</p>
        <a href="${link}" style="display:inline-block;margin:18px 0;padding:13px 28px;background:linear-gradient(135deg,#1a1a2e,#0f3460);color:#e2c97e;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          ✅ Verify My Email
        </a>
        <p style="color:#888;font-size:12px;">Or copy: <a href="${link}" style="color:#c9a84c;">${link}</a></p>
      </div>`,
  });
}

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // When email is not configured → auto-verify so users can book immediately.
    // When email IS configured → send a verification link and require clicking it.
    const autoVerify = !EMAIL_CONFIGURED;
    const verifyToken = autoVerify ? null : makeVerifyToken();
    const verifyTokenExpires = autoVerify ? null : new Date(Date.now() + TOKEN_TTL_MS);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'customer',
      emailVerified: autoVerify,
      verifyToken,
      verifyTokenExpires,
    });

    if (autoVerify) {
      console.log(`[Register] Auto-verified ${user.email} (email not configured)`);
    } else {
      try {
        await sendVerificationEmail(user, verifyToken);
      } catch (mailErr) {
        console.warn('[Register] Verification email failed:', mailErr.message);
      }
    }

    res.status(201).json({
      message: autoVerify
        ? 'Registration successful! You can now log in and make bookings.'
        : 'Registration successful. Please check your email and click the verification link before booking.',
      emailVerificationRequired: !autoVerify,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: autoVerify },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── GET /api/auth/verify-email?token=xxx ────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const user = await User.findOne({ where: { verifyToken: token } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or already used verification link' });
    }

    if (new Date() > new Date(user.verifyTokenExpires)) {
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }

    await user.update({ emailVerified: true, verifyToken: null, verifyTokenExpires: null });
    res.json({ message: 'Email verified successfully! You can now log in and make bookings.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/resend-verification ──────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user || user.emailVerified) {
      return res.json({ message: 'If that email is registered and unverified, a new link has been sent.' });
    }

    if (!EMAIL_CONFIGURED) {
      // No email — just verify them now
      await user.update({ emailVerified: true, verifyToken: null, verifyTokenExpires: null });
      return res.json({ message: 'Email service is not configured. Your account has been verified automatically.' });
    }

    const token = makeVerifyToken();
    await user.update({ verifyToken: token, verifyTokenExpires: new Date(Date.now() + TOKEN_TTL_MS) });

    try { await sendVerificationEmail(user, token); }
    catch (mailErr) { console.warn('[Resend] Email failed:', mailErr.message); }

    res.json({ message: 'If that email is registered and unverified, a new link has been sent.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email?.toLowerCase().trim() } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── POST /api/auth/admin/verify-user  (admin only) ──────────────────────────
router.post('/admin/verify-user', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ emailVerified: true, verifyToken: null, verifyTokenExpires: null });
    res.json({ message: `${user.email} has been manually verified.`, user: { id: user.id, email: user.email, emailVerified: true } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/auth/admin/users  (admin only) ──────────────────────────────────
router.get('/admin/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'emailVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Verify Google ID token from frontend, create/find user, return JWT
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential is required' });

    // Verify the Google ID token
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ error: 'Google account email is not verified' });
    }

    // Find or create user
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // New user — create with emailVerified=true (Google already verified it)
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: await bcrypt.hash(Math.random().toString(36), 10), // random unusable password
        role: 'customer',
        emailVerified: true,
      });
      console.log(`[Google OAuth] New user created: ${email}`);
    } else if (!user.emailVerified) {
      // Existing unverified user — verify them now
      await user.update({ emailVerified: true });
    }

    // Block staff from using Google login
    if (['admin', 'manager', 'receptionist'].includes(user.role)) {
      return res.status(403).json({ error: 'Staff accounts must use the Staff Portal.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error('[Google OAuth] Error:', error.message);
    res.status(400).json({ error: 'Google authentication failed. Please try again.' });
  }
});

module.exports = router;
