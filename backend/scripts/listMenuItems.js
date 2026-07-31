require('dotenv').config();
const s = require('../config/database');
const M = require('../models/MenuItem');
s.authenticate().then(async () => {
  const items = await M.findAll({
    attributes: ['name','serviceCategory','category'],
    order: [['serviceCategory','ASC'],['category','ASC']]
  });
  items.forEach(i => console.log(`${i.serviceCategory} | ${i.category} | ${i.name}`));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
