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

    // Staff accounts (admin / manager / receptionist / it) never get blocked by
    // emailVerified — they may have been created by seed scripts without
    // going through the email verification flow.
    const isStaff = ['admin', 'manager', 'receptionist', 'it'].includes(user.role);
    if (!isStaff && !user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in.',
        unverified: true,
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        kycStatus: user.kycStatus || 'pending',
      },
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
        kycStatus: user.kycStatus || 'pending',
      },
    });
  } catch (error) {
    console.error('[Google OAuth] Error:', error.message);
    res.status(400).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ── POST /api/auth/kyc  (authenticated customer) ─────────────────────────────
// Submit personal info + ID images for KYC verification
const kycUpload = require('multer');
const { v2: kycCloudinary } = require('cloudinary');

kycCloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { CloudinaryStorage: KycCloudinaryStorage } = require('multer-storage-cloudinary');
const kycStorage = new KycCloudinaryStorage({
  cloudinary: kycCloudinary,
  params: {
    folder: 'hotel-kyc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    public_id: (req, file) => 'kyc-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
  },
});
const kycMulter = kycUpload({ storage: kycStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/kyc',
  authenticateToken,
  kycMulter.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack',  maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { phone, dateOfBirth, nationality, idType } = req.body;
      const fullName = req.body.fullName ? req.body.fullName.trim() : null;

      if (!phone || !dateOfBirth || !nationality || !idType) {
        return res.status(400).json({ error: 'phone, dateOfBirth, nationality and idType are required' });
      }
      if (!fullName) {
        return res.status(400).json({ error: 'Full name is required' });
      }
      if (!['national_id', 'passport'].includes(idType)) {
        return res.status(400).json({ error: 'idType must be national_id or passport' });
      }
      if (!req.files?.idFront) {
        return res.status(400).json({ error: 'Front side of ID is required' });
      }
      if (idType === 'national_id' && !req.files?.idBack) {
        return res.status(400).json({ error: 'Back side is required for National ID' });
      }

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.emailVerified) {
        return res.status(403).json({ error: 'Please verify your email before submitting KYC' });
      }

      const idFrontUrl = req.files.idFront[0].path;
      const idBackUrl  = req.files.idBack ? req.files.idBack[0].path : null;

      await user.update({
        name:             fullName,
        phone:            phone.trim(),
        dateOfBirth:      dateOfBirth,
        nationality:      nationality.trim(),
        idType,
        idFront:          idFrontUrl,
        idBack:           idBackUrl,
        kycStatus:        'submitted',
        kycSubmittedAt:   new Date(),
        kycRejectedReason: null,
      });

      res.json({
        message: 'KYC documents submitted successfully. Staff will review within 24 hours.',
        kycStatus: 'submitted',
      });
    } catch (error) {
      console.error('[KYC] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ── GET /api/auth/kyc/status  (authenticated customer) ───────────────────────
router.get('/kyc/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'emailVerified', 'kycStatus', 'kycRejectedReason', 'phone', 'nationality', 'idType'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/auth/admin/kyc/:userId  (admin/manager/receptionist) ────────────
// Staff approve or reject a KYC submission
router.post('/admin/kyc/:userId',
  authenticateToken,
  authorizeRole(['admin', 'manager', 'receptionist']),
  async (req, res) => {
    try {
      const { action, reason } = req.body; // action: 'approved' | 'rejected'
      if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'action must be approved or rejected' });
      }

      const user = await User.findByPk(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      await user.update({
        kycStatus: action,
        kycRejectedReason: action === 'rejected' ? (reason || 'Documents unclear or invalid') : null,
      });

      res.json({
        message: `KYC ${action} for ${user.email}`,
        kycStatus: action,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── GET /api/auth/admin/kyc  (admin/manager/receptionist) ────────────────────
// Get all customers with their KYC status
router.get('/admin/kyc',
  authenticateToken,
  authorizeRole(['admin', 'manager', 'receptionist']),
  async (req, res) => {
    try {
      const users = await User.findAll({
        where: { role: 'customer' },
        attributes: ['id', 'name', 'email', 'phone', 'nationality', 'idType', 'idFront', 'idBack', 'kycStatus', 'kycRejectedReason', 'kycSubmittedAt', 'emailVerified', 'createdAt'],
        order: [['kycSubmittedAt', 'DESC'], ['createdAt', 'DESC']],
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// IT MANAGEMENT ROUTES (IT role submits requests, Admin approves)
// ══════════════════════════════════════════════════════════════════════════════

const ITRequest = require('../models/ITRequest');

// ── POST /api/auth/it/request-create ─────────────────────────────────────────
// IT staff requests to create a new staff account (admin/manager/receptionist/it)
router.post('/it/request-create',
  authenticateToken,
  authorizeRole(['it']),
  async (req, res) => {
    try {
      const { email, name, role, password } = req.body;
      
      if (!email || !name || !role || !password) {
        return res.status(400).json({ error: 'email, name, role and password are required' });
      }

      if (!['admin', 'manager', 'receptionist', 'it'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be admin, manager, receptionist, or it' });
      }

      // Check if user already exists
      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Hash password for storage in request
      const hashedPassword = await bcrypt.hash(password, 10);

      const request = await ITRequest.create({
        type: 'create',
        targetEmail: email.toLowerCase().trim(),
        targetName: name.trim(),
        targetRole: role,
        newPassword: hashedPassword,
        status: 'pending',
        requestedBy: req.user.id,
      });

      res.status(201).json({
        message: 'Account creation request submitted. Awaiting admin approval.',
        request: {
          id: request.id,
          type: request.type,
          targetEmail: request.targetEmail,
          targetName: request.targetName,
          targetRole: request.targetRole,
          status: request.status,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── POST /api/auth/it/request-reset ──────────────────────────────────────────
// IT staff requests to reset password for an existing staff account
router.post('/it/request-reset',
  authenticateToken,
  authorizeRole(['it']),
  async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ error: 'email and newPassword are required' });
      }

      // Check if user exists and is staff
      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!['admin', 'manager', 'receptionist', 'it'].includes(user.role)) {
        return res.status(400).json({ error: 'Can only reset passwords for staff accounts' });
      }

      // Hash password for storage in request
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const request = await ITRequest.create({
        type: 'reset',
        targetEmail: email.toLowerCase().trim(),
        targetName: user.name,
        targetRole: user.role,
        newPassword: hashedPassword,
        status: 'pending',
        requestedBy: req.user.id,
      });

      res.status(201).json({
        message: 'Password reset request submitted. Awaiting admin approval.',
        request: {
          id: request.id,
          type: request.type,
          targetEmail: request.targetEmail,
          targetName: request.targetName,
          status: request.status,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── POST /api/auth/it/request-delete ─────────────────────────────────────────
// IT staff requests to delete a staff account
router.post('/it/request-delete',
  authenticateToken,
  authorizeRole(['it']),
  async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'email is required' });
      }

      // Check if user exists and is staff
      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!['admin', 'manager', 'receptionist', 'it'].includes(user.role)) {
        return res.status(400).json({ error: 'Can only delete staff accounts' });
      }

      // Prevent deleting yourself
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const request = await ITRequest.create({
        type: 'delete',
        targetEmail: email.toLowerCase().trim(),
        targetName: user.name,
        targetRole: user.role,
        status: 'pending',
        requestedBy: req.user.id,
      });

      res.status(201).json({
        message: 'Account deletion request submitted. Awaiting admin approval.',
        request: {
          id: request.id,
          type: request.type,
          targetEmail: request.targetEmail,
          targetName: request.targetName,
          targetRole: request.targetRole,
          status: request.status,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── GET /api/auth/it/my-requests ─────────────────────────────────────────────
// IT staff views their own submitted requests
router.get('/it/my-requests',
  authenticateToken,
  authorizeRole(['it']),
  async (req, res) => {
    try {
      const requests = await ITRequest.findAll({
        where: { requestedBy: req.user.id },
        include: [
          { model: User, as: 'approver', attributes: ['id', 'name', 'email', 'role'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN APPROVAL ROUTES (Admin reviews and approves/rejects IT requests)
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/auth/admin/it-requests ──────────────────────────────────────────
// Admin views all pending IT requests
router.get('/admin/it-requests',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { status } = req.query;
      const where = status ? { status } : {};

      const requests = await ITRequest.findAll({
        where,
        include: [
          { model: User, as: 'requester', attributes: ['id', 'name', 'email', 'role'] },
          { model: User, as: 'approver', attributes: ['id', 'name', 'email', 'role'] },
        ],
        order: [['createdAt', 'DESC']],
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── POST /api/auth/admin/it-requests/:id/approve ─────────────────────────────
// Admin approves an IT request and executes the action
router.post('/admin/it-requests/:id/approve',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const request = await ITRequest.findByPk(id, {
        include: [{ model: User, as: 'requester', attributes: ['id', 'name', 'email'] }],
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: `Request already ${request.status}` });
      }

      // Execute the requested action
      let resultMessage = '';

      if (request.type === 'create') {
        // Create new staff account
        const newUser = await User.create({
          name: request.targetName,
          email: request.targetEmail,
          password: request.newPassword, // already hashed
          role: request.targetRole,
          emailVerified: true, // Staff accounts are pre-verified
        });
        resultMessage = `Staff account created: ${newUser.email} (${newUser.role})`;
      } 
      else if (request.type === 'reset') {
        // Reset password for existing account
        const user = await User.findOne({ where: { email: request.targetEmail } });
        if (!user) {
          return res.status(404).json({ error: 'Target user not found' });
        }
        await user.update({ password: request.newPassword }); // already hashed
        resultMessage = `Password reset for: ${user.email}`;
      } 
      else if (request.type === 'delete') {
        // Delete staff account
        const user = await User.findOne({ where: { email: request.targetEmail } });
        if (!user) {
          return res.status(404).json({ error: 'Target user not found' });
        }
        await user.destroy();
        resultMessage = `Account deleted: ${request.targetEmail}`;
      }
      else if (request.type === 'rename') {
        // Rename staff display name
        const user = await User.findOne({ where: { email: request.targetEmail } });
        if (!user) {
          return res.status(404).json({ error: 'Target user not found' });
        }
        const oldName = user.name;
        await user.update({ name: request.targetName });
        resultMessage = `Username renamed: ${oldName} → ${request.targetName}`;
      }

      // Mark request as approved
      await request.update({
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });

      res.json({
        message: `Request approved. ${resultMessage}`,
        request,
      });
    } catch (error) {
      console.error('[IT Request Approval] Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ── POST /api/auth/admin/it-requests/:id/reject ──────────────────────────────
// Admin rejects an IT request
router.post('/admin/it-requests/:id/reject',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const request = await ITRequest.findByPk(id, {
        include: [{ model: User, as: 'requester', attributes: ['id', 'name', 'email'] }],
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: `Request already ${request.status}` });
      }

      await request.update({
        status: 'rejected',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        rejectionReason: reason || 'No reason provided',
      });

      res.json({
        message: 'Request rejected',
        request,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── POST /api/auth/it/request-rename ─────────────────────────────────────────
// IT staff requests to rename (change display name) for a staff account
router.post('/it/request-rename',
  authenticateToken,
  authorizeRole(['it']),
  async (req, res) => {
    try {
      const { email, newName } = req.body;

      if (!email || !newName) {
        return res.status(400).json({ error: 'email and newName are required' });
      }

      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!['admin', 'manager', 'receptionist', 'it'].includes(user.role)) {
        return res.status(400).json({ error: 'Can only rename staff accounts' });
      }

      const request = await ITRequest.create({
        type: 'rename',
        targetEmail: email.toLowerCase().trim(),
        targetName: newName.trim(),   // stores the NEW name as targetName
        targetRole: user.role,
        status: 'pending',
        requestedBy: req.user.id,
      });

      res.status(201).json({
        message: 'Username rename request submitted. Awaiting admin approval.',
        request: {
          id: request.id,
          type: request.type,
          targetEmail: request.targetEmail,
          targetName: request.targetName,
          status: request.status,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
