require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

async function reset() {
  await sequelize.authenticate();

  const accounts = [
    { email: 'admin@hotel.com',        password: 'admin123' },
    { email: 'manager@hotel.com',      password: 'manager123' },
    { email: 'receptionist@hotel.com', password: 'receptionist123' },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const [updated] = await User.update(
      { password: hash },
      { where: { email: acc.email } }
    );
    console.log(`${updated ? '✅' : '❌'} ${acc.email} → password reset to: ${acc.password}`);
  }

  process.exit(0);
}

reset().catch(e => { console.error(e.message); process.exit(1); });
