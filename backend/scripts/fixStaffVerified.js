/**
 * One-time fix: set emailVerified = true for all staff accounts
 * (admin, manager, receptionist) so they can log in via the Staff Portal.
 *
 * Run: node scripts/fixStaffVerified.js
 */
require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');

async function fix() {
  await sequelize.authenticate();
  console.log('Connected to database.');

  const [count] = await sequelize.query(
    `UPDATE "Users" SET "emailVerified" = true WHERE role IN ('admin','manager','receptionist') AND "emailVerified" = false`
  );

  const staff = await User.findAll({
    where: { role: ['admin', 'manager', 'receptionist'] },
    attributes: ['id', 'name', 'email', 'role', 'emailVerified'],
  });

  console.log('\nStaff accounts after fix:');
  staff.forEach(u => {
    console.log(`  [${u.emailVerified ? '✅' : '❌'}] ${u.role} — ${u.email}`);
  });

  console.log('\nDone. All staff accounts can now log in.');
  process.exit(0);
}

fix().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
