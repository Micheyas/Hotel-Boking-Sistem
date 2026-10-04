const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

// Seeds ONLY the demo staff accounts. Safe to re-run: skips emails that already exist.
// Usage (Render Shell):  node scripts/seedStaffOnly.js   (or: node backend/scripts/seedStaffOnly.js)
async function seedStaffOnly() {
  try {
    await sequelize.authenticate();

    const staff = [
      { name: 'Admin User',        email: 'admin@hotel.com',        password: 'admin123',        role: 'admin' },
      { name: 'Manager User',      email: 'manager@hotel.com',      password: 'manager123',      role: 'manager' },
      { name: 'Receptionist User', email: 'receptionist@hotel.com', password: 'receptionist123', role: 'receptionist' },
      { name: 'IT Support',        email: 'it@hotel.com',           password: 'it123',           role: 'it' },
    ];

    for (const s of staff) {
      const existing = await User.findOne({ where: { email: s.email } });
      if (existing) {
        console.log(`- skipped (exists): ${s.email}`);
        continue;
      }
      const hash = await bcrypt.hash(s.password, 10);
      await User.create({ name: s.name, email: s.email, password: hash, role: s.role });
      console.log(`+ created: ${s.email} (${s.role})`);
    }

    console.log('\nDone. Demo logins:');
    console.log('  admin@hotel.com / admin123');
    console.log('  manager@hotel.com / manager123');
    console.log('  receptionist@hotel.com / receptionist123');
    console.log('  it@hotel.com / it123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seedStaffOnly();
