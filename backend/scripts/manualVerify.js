// Manually verifies a specific user by email — use while fixing Gmail credentials
require('dotenv').config();
const { Sequelize } = require('sequelize');

const EMAIL = process.argv[2] || 'mikiyasmelese03@gmail.com';

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'postgres', logging: false }
);

(async () => {
  try {
    await sequelize.authenticate();

    const [rows] = await sequelize.query(
      `SELECT id, email, "emailVerified" FROM "Users" WHERE email = '${EMAIL}'`
    );

    if (!rows.length) {
      console.log('User not found:', EMAIL);
      return;
    }

    await sequelize.query(
      `UPDATE "Users" SET "emailVerified" = true, "verifyToken" = NULL, "verifyTokenExpires" = NULL WHERE email = '${EMAIL}'`
    );

    console.log(`✅ ${EMAIL} is now manually verified — can log in and book.`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
