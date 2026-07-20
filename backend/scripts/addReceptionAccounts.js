const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

async function addReceptionAccounts() {
  try {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const receptionPassword = await bcrypt.hash('receptionist123', salt);

    // Create two additional receptionist accounts
    const receptionists = await Promise.all([
      User.create({
        name: 'Receptionist Two',
        email: 'receptionist2@hotel.com',
        password: receptionPassword,
        role: 'receptionist',
      }),
      User.create({
        name: 'Receptionist Three',
        email: 'receptionist3@hotel.com',
        password: receptionPassword,
        role: 'receptionist',
      }),
    ]);

    console.log('✅ Additional receptionist accounts created:');
    receptionists.forEach(user => {
      console.log(`  - ${user.name} (${user.role}): ${user.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating receptionist accounts:', error.message);
    process.exit(1);
  }
}

addReceptionAccounts();
