// Verify a user directly on the Neon cloud database
require('dotenv').config();
const { Sequelize } = require('sequelize');

const EMAIL = process.argv[2] || 'mikiyasmelese03@gmail.com';

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to Neon cloud DB');

    // Check user
    const [rows] = await sequelize.query(
      `SELECT id, email, "emailVerified" FROM "Users" WHERE email = '${EMAIL}'`
    );

    if (!rows.length) {
      console.log('User not found:', EMAIL);
      await sequelize.close(); return;
    }

    console.log('Before:', rows[0]);

    // Force verify
    await sequelize.query(
      `UPDATE "Users" SET "emailVerified" = true, "verifyToken" = NULL, "verifyTokenExpires" = NULL WHERE email = '${EMAIL}'`
    );

    const [after] = await sequelize.query(
      `SELECT id, email, "emailVerified" FROM "Users" WHERE email = '${EMAIL}'`
    );
    console.log('After:', after[0]);
    console.log('✅ Done — user can now log in');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
