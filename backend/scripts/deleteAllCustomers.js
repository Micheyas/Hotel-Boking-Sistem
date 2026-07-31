// Deletes ALL customer accounts — keeps staff only
require('dotenv').config();
const { Sequelize } = require('sequelize');

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

    const [customers] = await sequelize.query(
      `SELECT id, email FROM "Users" WHERE role = 'customer'`
    );

    if (!customers.length) {
      console.log('No customer accounts found.');
      return;
    }

    console.log('Deleting:');
    customers.forEach(u => console.log(`  ❌ ${u.email}`));

    await sequelize.query(`DELETE FROM "Users" WHERE role = 'customer'`);

    console.log(`\n✅ Deleted ${customers.length} customer account(s).`);
    console.log('Database is clean — ready for real customers.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
