// Check and fix email verification status for all users
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
      'SELECT id, name, email, role, "emailVerified" FROM "Users" ORDER BY id'
    );

    console.log('\n=== ALL USERS ===');
    users.forEach(u => {
      const status = u.emailVerified ? '✅ verified' : '❌ NOT verified';
      console.log(`  [${u.id}] ${u.email} (${u.role}) — ${status}`);
    });

    const unverified = users.filter(u => !u.emailVerified);
    if (unverified.length > 0) {
      console.log(`\nFixing ${unverified.length} unverified user(s)...`);
      await sequelize.query('UPDATE "Users" SET "emailVerified" = true WHERE "emailVerified" = false');
      console.log('✅ All users are now verified.');
    } else {
      console.log('\n✅ All users are already verified — no fix needed.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
