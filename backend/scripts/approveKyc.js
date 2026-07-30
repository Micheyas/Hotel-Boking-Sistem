// Manually approve KYC for a user by email
// Usage: node scripts/approveKyc.js customer@email.com
require('dotenv').config();
const { Sequelize } = require('sequelize');

const EMAIL = process.argv[2];
if (!EMAIL) { console.error('Usage: node scripts/approveKyc.js email@example.com'); process.exit(1); }

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,
  {
    host: process.env.DB_HOST, dialect: 'postgres', logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(`SELECT id, email, "kycStatus" FROM "Users" WHERE email = '${EMAIL}'`);
    if (!rows.length) { console.log('User not found:', EMAIL); return; }
    console.log('Before:', rows[0]);
    await sequelize.query(`UPDATE "Users" SET "kycStatus" = 'approved' WHERE email = '${EMAIL}'`);
    const [after] = await sequelize.query(`SELECT id, email, "kycStatus" FROM "Users" WHERE email = '${EMAIL}'`);
    console.log('After:', after[0]);
    console.log('✅ KYC approved —', EMAIL, 'can now book rooms.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
