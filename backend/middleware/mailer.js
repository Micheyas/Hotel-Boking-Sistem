// Email is optional — if credentials are not configured, all sends are silently skipped.
// The system works fully without email (local bank transfer / screenshot workflow).

const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (
  process.env.EMAIL_SERVICE &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_USER !== 'your_email@gmail.com' &&
  process.env.EMAIL_PASS !== 'your_app_password'
) {
  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('✅ Email service configured:', process.env.EMAIL_USER);
  } catch (err) {
    console.warn('⚠️  Email transporter setup failed — emails will be skipped:', err.message);
  }
} else {
  console.log('ℹ️  Email not configured — running without email notifications.');
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    // Silently skip — no crash, no error
    console.log(`[Email skipped] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email sent] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    // Log but never crash the request
    console.warn(`[Email failed] To: ${to} | Error: ${err.message}`);
  }
};

module.exports = { sendEmail };
