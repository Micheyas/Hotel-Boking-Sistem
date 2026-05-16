/**
 * One-time fix: updates the receptionist account to use
 *   email:    receptionist@hotel.com
 *   password: receptionist123
 *
 * Run once with:  node scripts/fixReceptionist.js
 */

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');

async function fix() {
  await sequelize.authenticate();

  const newPassword = await bcrypt.hash('receptionist123', 10);

  // Try to find by old email OR existing correct email
  const existing = await User.findOne({
    where: {
      email: { [Op.in]: ['reception@hotel.com', 'receptionist@hotel.com'] },
      role: 'receptionist',
    },
  });

  if (existing) {
    await existing.update({
      email: 'receptionist@hotel.com',
      password: newPassword,
    });
    console.log('✅ Receptionist account updated:');
    console.log('   Email:    receptionist@hotel.com');
    console.log('   Password: receptionist123');
  } else {
    // Create fresh if not found
    await User.create({
      name: 'Receptionist User',
      email: 'receptionist@hotel.com',
      password: newPassword,
      role: 'receptionist',
    });
    console.log('✅ Receptionist account created:');
    console.log('   Email:    receptionist@hotel.com');
    console.log('   Password: receptionist123');
  }

  process.exit(0);
}

fix().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
