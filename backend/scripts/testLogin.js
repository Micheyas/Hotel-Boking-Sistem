require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const User = require('../models/User');

async function test() {
  await sequelize.authenticate();

  const email = 'receptionist@hotel.com';
  const password = 'receptionist123';

  console.log('JWT_SECRET:', process.env.JWT_SECRET ? `"${process.env.JWT_SECRET}"` : '❌ NOT SET');
  console.log('Testing login for:', email);

  const user = await User.findOne({ where: { email } });
  if (!user) { console.log('❌ User not found'); process.exit(1); }

  console.log('✅ User found, role:', user.role);
  console.log('Stored hash:', user.password);

  const match = await bcrypt.compare(password, user.password);
  console.log('Password match:', match ? '✅ YES' : '❌ NO');

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret') {
    console.log('❌ JWT_SECRET is not set or still placeholder — this will cause login to fail');
  } else {
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    console.log('✅ Token generated OK:', token.substring(0, 30) + '...');
  }

  process.exit(0);
}

test().catch(e => { console.error('Error:', e.message); process.exit(1); });
