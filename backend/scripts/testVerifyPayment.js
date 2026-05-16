require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const User = require('../models/User');
const Booking = require('../models/Booking');

async function test() {
  await sequelize.authenticate();

  // 1. Get receptionist user
  const user = await User.findOne({ where: { email: 'receptionist@hotel.com' } });
  if (!user) { console.log('❌ Receptionist not found'); process.exit(1); }
  console.log('✅ User:', user.email, '| role:', user.role);

  // 2. Check JWT_SECRET
  console.log('✅ JWT_SECRET:', process.env.JWT_SECRET);

  // 3. Generate token exactly like login does
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  console.log('✅ Token:', token.substring(0, 40) + '...');

  // 4. Verify the token back
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Decoded token:', decoded);

  // 5. Check what bookings have proof_submitted
  const pending = await Booking.findAll({ where: { paymentStatus: 'proof_submitted' } });
  console.log(`\n📋 Bookings with proof_submitted: ${pending.length}`);
  pending.forEach(b => console.log(`  Booking #${b.id} — room ${b.roomId} — status: ${b.status}`));

  // 6. Simulate the authorizeRole check
  const roles = ['admin', 'manager', 'receptionist'];
  console.log('\n🔐 authorizeRole check:', roles.includes(decoded.role) ? '✅ PASS' : '❌ FAIL');

  process.exit(0);
}

test().catch(e => { console.error('Error:', e.message); process.exit(1); });
