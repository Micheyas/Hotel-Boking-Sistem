// Deletes test/fake customer accounts — keeps all staff accounts intact
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'postgres', logging: false }
);

// Emails to delete — only test/fake accounts, never staff
const TEST_EMAILS = [
  'newcustomer@test.com',
  'unverified@test.com',
  'mikiyasmelese336@gmail.com', // test registration only — real email stays for actual use
];

(async () => {
  try {
    await sequelize.authenticate();

    console.log('\nUsers BEFORE cleanup:');
    const [before] = await sequelize.query(
      'SELECT id, email, role, "emailVerified" FROM "Users" ORDER BY id'
    );
    before.forEach(u =>
      console.log(`  [${u.id}] ${u.email} (${u.role}) — ${u.emailVerified ? '✅' : '❌'}`)
    );

    // Safety: only delete customer-role accounts in the test list
    for (const email of TEST_EMAILS) {
      const [rows] = await sequelize.query(
        `SELECT id, role FROM "Users" WHERE email = '${email}'`
      );
      if (!rows.length) {
        console.log(`\n  skip: ${email} — not found`);
        continue;
      }
      const user = rows[0];
      if (user.role !== 'customer') {
        console.log(`\n  skip: ${email} — is ${user.role}, will not delete staff`);
        continue;
      }
      await sequelize.query(`DELETE FROM "Users" WHERE id = ${user.id}`);
      console.log(`\n  ✅ Deleted: ${email}`);
    }

    console.log('\nUsers AFTER cleanup:');
    const [after] = await sequelize.query(
      'SELECT id, email, role, "emailVerified" FROM "Users" ORDER BY id'
    );
    after.forEach(u =>
      console.log(`  [${u.id}] ${u.email} (${u.role}) — ${u.emailVerified ? '✅ verified' : '❌ unverified'}`)
    );

    console.log('\nDone. Only real staff accounts remain.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
