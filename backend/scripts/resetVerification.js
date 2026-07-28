// Resets emailVerified=false for all CUSTOMER accounts only.
// Staff (admin/manager/receptionist) stay verified.
// Run AFTER configuring real email credentials in .env
// Usage: node scripts/resetVerification.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'postgres', logging: false }
);

(async () => {
  try {
    await sequelize.authenticate();

    const [users] = await sequelize.query(
      `SELECT id, email, role, "emailVerified" FROM "Users" ORDER BY id`
    );

    console.log('\nCurrent users:');
    users.forEach(u =>
      console.log(`  [${u.id}] ${u.email} (${u.role}) — ${u.emailVerified ? '✅ verified' : '❌ unverified'}`)
    );

    // Only reset customers — never lock out staff
    const [, meta] = await sequelize.query(
      `UPDATE "Users" SET "emailVerified" = false WHERE role = 'customer'`
    );
    console.log(`\n✅ Reset ${meta.rowCount} customer(s) to unverified.`);
    console.log('   They will need to verify their email before booking.');
    console.log('   Staff accounts (admin/manager/receptionist) are unaffected.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
