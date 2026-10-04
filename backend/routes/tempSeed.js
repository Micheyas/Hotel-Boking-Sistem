// TEMPORARY one-time route: seeds the demo staff accounts in production.
// This file is removed immediately after use. Guarded by a single-use token.
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const ONE_TIME_TOKEN = '8f5f2974848a59531f82b2d690aee3a9046914cb521db18c';

router.post('/run-seed', async (req, res) => {
  if (req.query.token !== ONE_TIME_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const staff = [
      { name: 'Admin User',        email: 'admin@hotel.com',        password: 'admin123',        role: 'admin' },
      { name: 'Manager User',      email: 'manager@hotel.com',      password: 'manager123',      role: 'manager' },
      { name: 'Receptionist User', email: 'receptionist@hotel.com', password: 'receptionist123', role: 'receptionist' },
      { name: 'IT Support',        email: 'it@hotel.com',           password: 'it123',           role: 'it' },
    ];
    const results = [];
    for (const s of staff) {
      const existing = await User.findOne({ where: { email: s.email } });
      if (existing) { results.push({ email: s.email, status: 'skipped-exists' }); continue; }
      const hash = await bcrypt.hash(s.password, 10);
      await User.create({ name: s.name, email: s.email, password: hash, role: s.role });
      results.push({ email: s.email, status: 'created' });
    }
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
