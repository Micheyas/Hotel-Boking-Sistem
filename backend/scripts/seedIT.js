/**
 * Seeds the IT account and creates the ITRequests table.
 * Run: node scripts/seedIT.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

// Load all models so associations are registered
require('../models/index');
const User = require('../models/User');
const ITRequest = require('../models/ITRequest');

async function run() {
  await sequelize.authenticate();
  console.log('Connected.\n');

  // Sync only the new tables (alter existing ones safely)
  await ITRequest.sync({ alter: true });
  console.log('✅ ITRequests table synced');

  // Also update the Users role ENUM to include 'it'
  try {
    await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'it'`);
    console.log('✅ Added "it" to Users role ENUM');
  } catch (e) {
    console.log('ℹ️  ENUM already has "it" or alter not needed:', e.message);
  }

  // Create IT account (upsert)
  const hash = await bcrypt.hash('it123', 10);
  const [itUser, created] = await User.findOrCreate({
    where: { email: 'it@hotel.com' },
    defaults: {
      name: 'IT Support',
      email: 'it@hotel.com',
      password: hash,
      role: 'it',
      emailVerified: true,
    },
  });

  if (!created) {
    // Update existing record to ensure correct role and emailVerified
    await itUser.update({ role: 'it', emailVerified: true, password: hash });
    console.log('✅ IT account updated: it@hotel.com / it123');
  } else {
    console.log('✅ IT account created: it@hotel.com / it123');
  }

  // Verify password works
  const ok = await bcrypt.compare('it123', itUser.password);
  console.log(`✅ Password check: ${ok ? 'OK' : 'FAIL'}`);

  // Show all staff accounts
  const staff = await User.findAll({
    where: { role: ['admin', 'manager', 'receptionist', 'it'] },
    attributes: ['id', 'name', 'email', 'role', 'emailVerified'],
    order: [['role', 'ASC']],
  });
  console.log('\nAll staff accounts:');
  staff.forEach(u => {
    console.log(`  [${u.emailVerified ? '✅' : '❌'}] ${u.role.padEnd(12)} ${u.email}`);
  });

  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
