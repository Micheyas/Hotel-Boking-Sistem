// Seeds staff accounts into Neon cloud database
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

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

const STAFF = [
  { name: 'Admin',        email: 'admin@hotel.com',        password: 'admin123',        role: 'admin' },
  { name: 'Manager',      email: 'manager@hotel.com',      password: 'manager123',      role: 'manager' },
  { name: 'Receptionist', email: 'receptionist@hotel.com', password: 'reception123',    role: 'receptionist' },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to Neon cloud DB\n');

    for (const staff of STAFF) {
      // Check if already exists
      const [existing] = await sequelize.query(
        `SELECT id, email FROM "Users" WHERE email = '${staff.email}'`
      );

      if (existing.length) {
        // Make sure they are verified
        await sequelize.query(
          `UPDATE "Users" SET "emailVerified" = true WHERE email = '${staff.email}'`
        );
        console.log(`✅ ${staff.email} already exists — marked verified`);
        continue;
      }

      // Create new staff account
      const hashed = await bcrypt.hash(staff.password, 10);
      await sequelize.query(
        `INSERT INTO "Users" (name, email, password, role, "emailVerified", "createdAt", "updatedAt")
         VALUES ('${staff.name}', '${staff.email}', '${hashed}', '${staff.role}', true, NOW(), NOW())`
      );
      console.log(`✅ Created: ${staff.email} (${staff.role}) — password: ${staff.password}`);
    }

    console.log('\nAll staff accounts ready in Neon cloud DB');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
