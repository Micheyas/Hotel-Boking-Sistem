require('dotenv').config();
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const User = require('../models/User');
const Booking = require('../models/Booking');

async function test() {
  await sequelize.authenticate();

  // 1. Login as receptionist
  const user = await User.findOne({ where: { email: 'receptionist@hotel.com' } });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  console.log('Token role:', user.role);

  // 2. Find a booking with proof_submitted
  const booking = await Booking.findOne({ where: { paymentStatus: 'proof_submitted' } });
  if (!booking) {
    console.log('❌ No booking with proof_submitted found. Upload a payment screenshot first.');
    process.exit(0);
  }
  console.log('Testing verify on booking #', booking.id);

  // 3. Make the actual HTTP request
  const body = JSON.stringify({ action: 'approve' });
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: `/api/payments/${booking.id}/verify-proof`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${token}`,
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      console.log('Response:', data);
      if (res.statusCode === 200) {
        console.log('✅ Payment verification WORKS');
      } else {
        console.log('❌ Payment verification FAILED');
      }
      process.exit(0);
    });
  });

  req.on('error', e => { console.error('Request error:', e.message); process.exit(1); });
  req.write(body);
  req.end();
}

test().catch(e => { console.error(e.message); process.exit(1); });
