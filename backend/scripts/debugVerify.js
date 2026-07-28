// Debug email verification for a specific user
require('dotenv').config();
const { Sequelize } = require('sequelize');
const http = require('http');

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'postgres', logging: false }
);

const EMAIL = 'mikiyasmelese03@gmail.com';

(async () => {
  try {
    await sequelize.authenticate();

    const [rows] = await sequelize.query(
      `SELECT id, email, "emailVerified", "verifyToken", "verifyTokenExpires" FROM "Users" WHERE email = '${EMAIL}'`
    );

    if (!rows.length) {
      console.log('❌ User not found:', EMAIL);
      await sequelize.close(); return;
    }

    const u = rows[0];
    console.log('\n=== User Info ===');
    console.log('Email       :', u.email);
    console.log('Verified    :', u.emailVerified);
    console.log('Token exists:', !!u.verifyToken);
    console.log('Token       :', u.verifyToken ? u.verifyToken.substring(0, 16) + '...' : 'NONE');
    console.log('Expires     :', u.verifyTokenExpires || 'N/A');
    console.log('Expired?    :', u.verifyTokenExpires ? (new Date() > new Date(u.verifyTokenExpires) ? 'YES ❌' : 'NO ✅') : 'N/A');

    if (!u.verifyToken) {
      console.log('\n⚠️  No verify token — user was auto-verified or token was already used.');
    }

    // ── Generate a FRESH token and manually build the verify link ──
    const crypto = require('crypto');
    const newToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sequelize.query(
      `UPDATE "Users" SET "verifyToken" = '${newToken}', "verifyTokenExpires" = '${expires.toISOString()}', "emailVerified" = false WHERE email = '${EMAIL}'`
    );

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${newToken}`;
    console.log('\n=== Fresh Verification Link Generated ===');
    console.log('Open this URL in your browser to verify:\n');
    console.log(verifyUrl);
    console.log('\nOR — resend the email by calling:');
    console.log(`POST http://localhost:5000/api/auth/resend-verification`);
    console.log(`Body: { "email": "${EMAIL}" }`);

    // ── Also try sending the email right now ──
    console.log('\n=== Attempting to send verification email now... ===');
    const { sendEmail } = require('../middleware/mailer');
    const link = verifyUrl;
    await sendEmail({
      to: EMAIL,
      subject: '📧 Verify your email — 2RN Solomon Hotel',
      text: `Hi,\n\nPlease verify your email:\n${link}\n\nExpires in 24 hours.`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#fffdf5;border:1px solid #e2c97e;border-radius:12px;">
        <h2 style="color:#1a1a2e;">📧 Verify Your Email</h2>
        <p>Click the button below to activate your account:</p>
        <a href="${link}" style="display:inline-block;padding:12px 28px;background:#1a1a2e;color:#e2c97e;border-radius:8px;font-weight:700;text-decoration:none;margin:16px 0;">
          ✅ Verify My Email
        </a>
        <p style="color:#888;font-size:12px;">Or copy this link: <a href="${link}">${link}</a></p>
        <p style="color:#888;font-size:12px;">Expires in 24 hours.</p>
      </div>`,
    });
    console.log('✅ Verification email sent to', EMAIL);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
