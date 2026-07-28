// Direct email test — bypasses all app logic
require('dotenv').config();
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const TO = process.argv[2] || EMAIL_USER; // send to self if no arg

console.log('Sending FROM:', EMAIL_USER);
console.log('Sending TO  :', TO);
console.log('Password set:', EMAIL_PASS ? `${EMAIL_PASS.substring(0,4)}...` : 'MISSING');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// Verify connection first
transporter.verify((err, success) => {
  if (err) {
    console.log('\n❌ SMTP CONNECTION FAILED:');
    console.log('Error code :', err.code);
    console.log('Error msg  :', err.message);
    console.log('\nLikely causes:');
    if (err.message.includes('BadCredentials') || err.message.includes('535')) {
      console.log('  → App password is wrong or 2FA is off on Google account');
      console.log('  → Go to: https://myaccount.google.com/apppasswords');
      console.log('  → Make sure 2-Step Verification is ON first');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      console.log('  → Firewall or network is blocking port 465/587');
      console.log('  → Try on a different network or disable VPN');
    }
    process.exit(1);
  }

  console.log('\n✅ SMTP connection verified — credentials are correct!');
  console.log('Sending test email...\n');

  transporter.sendMail({
    from: EMAIL_USER,
    to: TO,
    subject: '✅ Hotel Booking — Email Test',
    text: 'This is a test email from your Hotel Booking system. Email is working correctly!',
    html: `
      <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:auto;padding:28px;background:#fffdf5;border:1px solid #e2c97e;border-radius:12px;">
        <h2 style="color:#1a1a2e;margin-top:0;">✅ Email is Working!</h2>
        <p style="color:#333;">Your Hotel Booking email system is configured correctly.</p>
        <p style="color:#333;">From: <strong>${EMAIL_USER}</strong></p>
        <p style="color:#888;font-size:12px;">This is a test message — no action needed.</p>
      </div>`,
  }, (sendErr, info) => {
    if (sendErr) {
      console.log('❌ SEND FAILED:', sendErr.message);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Response  :', info.response);
      console.log('\nCheck inbox at:', TO);
      console.log('Also check SPAM folder if not in inbox.');
    }
  });
});
