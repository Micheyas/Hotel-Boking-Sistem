require('dotenv').config();
const s = require('../config/database');
s.authenticate().then(async () => {
  const [r] = await s.query("SELECT column_name FROM information_schema.columns WHERE table_name='MenuItems' ORDER BY ordinal_position");
  r.forEach(c => console.log(c.column_name));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
