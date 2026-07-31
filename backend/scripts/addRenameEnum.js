require('dotenv').config();
const sequelize = require('../config/database');

async function run() {
  await sequelize.authenticate();
  try {
    await sequelize.query(`ALTER TYPE "enum_ITRequests_type" ADD VALUE IF NOT EXISTS 'rename'`);
    console.log('✅ Added rename to ITRequests type ENUM');
  } catch (e) {
    console.log('ℹ️ ', e.message);
  }
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
