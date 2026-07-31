// List all customer accounts in Neon cloud DB
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
    const [users] = await sequelize.query(
      `SELECT id, name, email, role, "emailVerified", "kycStatus", "createdAt" 
       FROM "Users" ORDER BY role, "createdAt"`
    );
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach(u => {
      console.log(`  [${u.id}] ${u.email} | role: ${u.role} | verified: ${u.emailVerified} | kyc: ${u.kycStatus} | joined: ${new Date(u.createdAt).toLocaleDateString()}`);
    });
    console.log('\nTotal:', users.length, 'users');
    const customers = users.filter(u => u.role === 'customer');
    console.log('Customers:', customers.length);
    const staff = users.filter(u => u.role !== 'customer');
    console.log('Staff:', staff.length);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
