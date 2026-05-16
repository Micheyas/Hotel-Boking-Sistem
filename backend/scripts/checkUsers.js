require('dotenv').config();
const sequelize = require('../config/database');

async function check() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query('SELECT id, name, email, role FROM "Users" ORDER BY id');
  console.log('\nCurrent users in database:');
  console.table(rows);
  process.exit(0);
}

check().catch(e => { console.error(e.message); process.exit(1); });
