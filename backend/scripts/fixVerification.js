// One-time script: mark all existing users as email-verified
// Run with: node scripts/fixVerification.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    const [, meta] = await sequelize.query(
      'UPDATE "Users" SET "emailVerified" = true WHERE "emailVerified" = false'
    );
    console.log(`✅ Updated ${meta.rowCount} user(s) — all marked as email-verified.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
