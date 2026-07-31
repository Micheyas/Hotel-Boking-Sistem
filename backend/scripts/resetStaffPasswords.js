/**
 * Reset all staff passwords to known values and fix emailVerified.
 * Run: node scripts/resetStaffPasswords.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

async function run() {
  await sequelize.authenticate();
  console.log('Connected.\n');

  const staff = [
    { email: 'admin@hotel.com',        password: 'admin123',        role: 'admin' },
    { email: 'manager@hotel.com',      password: 'manager123',      role: 'manager' },
    { email: 'receptionist@hotel.com', password: 'receptionist123', role: 'receptionist' },
  ];

  for (const s of staff) {
    const hash = await bcrypt.hash(s.password, 10);
    const [updated] = await sequelize.query(
      `UPDATE "Users" SET password = :hash, "emailVerified" = true WHERE email = :email AND role = :role`,
      { replacements: { hash, email: s.email, role: s.role } }
    );
    const user = await User.findOne({ where: { email: s.email } });
    if (user) {
      console.log(`✅ ${user.role} | ${user.email} | emailVerified: ${user.emailVerified}`);
    } else {
      // Create if missing
      await User.create({
        name: s.role.charAt(0).toUpperCase() + s.role.slice(1) + ' User',
        email: s.email,
        password: hash,
        role: s.role,
        emailVerified: true,
      });
      console.log(`✅ Created: ${s.role} | ${s.email}`);
    }
  }

  // Verify passwords work
  console.log('\nVerifying passwords:');
  for (const s of staff) {
    const user = await User.findOne({ where: { email: s.email } });
    const ok = await bcrypt.compare(s.password, user.password);
    console.log(`  ${ok ? '✅' : '❌'} ${s.email} / ${s.password} — ${ok ? 'OK' : 'FAIL'}`);
  }

  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
