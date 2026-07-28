// Tests the email verification booking guard end-to-end
require('dotenv').config();
const http = require('http');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'postgres', logging: false }
);

function post(path, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 5000, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      }
    );
    req.write(data);
    req.end();
  });
}

(async () => {
  try {
    await sequelize.authenticate();

    // Find an available room
    const [rooms] = await sequelize.query('SELECT id, "roomNumber" FROM "Rooms" WHERE status=\'available\' LIMIT 1');
    if (!rooms.length) {
      console.log('❌ No available rooms to test with — free a room first');
      await sequelize.close(); return;
    }
    const room = rooms[0];
    console.log(`\nUsing room #${room.roomNumber} (id=${room.id}) for tests\n`);

    // ── Mark test email as unverified ──────────────────────────
    await sequelize.query(
      `UPDATE "Users" SET "emailVerified"=false WHERE email='mikiyasmelese336@gmail.com'`
    );
    console.log('Set mikiyasmelese336@gmail.com → emailVerified=false\n');

    // TEST 1: booking with unverified registered email → MUST be blocked
    console.log('TEST 1: Guest booking with unverified registered email');
    const r1 = await post('/api/bookings/guest', {
      roomId: room.id, checkInDate: '2026-09-10', checkOutDate: '2026-09-12',
      guestName: 'Mikiyas', guestEmail: 'mikiyasmelese336@gmail.com',
      guestPhone: '0911000000', totalPrice: 4000
    });
    console.log('  Status:', r1.status, '(expected 403)');
    console.log('  Message:', r1.body.error);
    console.log('  ✅ PASS:', r1.status === 403 ? 'Booking BLOCKED correctly' : '❌ FAIL: Booking was NOT blocked!');

    // TEST 2: booking with no email → should still be allowed (anonymous guest)
    console.log('\nTEST 2: Guest booking with no email (anonymous walk-in)');
    const r2 = await post('/api/bookings/guest', {
      roomId: room.id, checkInDate: '2026-09-10', checkOutDate: '2026-09-12',
      guestName: 'Walk In', guestEmail: '', guestPhone: '0911111111', totalPrice: 4000
    });
    console.log('  Status:', r2.status, '(expected 201 — anonymous guests allowed)');
    console.log('  ✅ PASS:', r2.status === 201 ? 'Anonymous guest booking allowed' : `Status was ${r2.status}: ${r2.body.error}`);

    // TEST 3: booking with unknown (not registered) email → should be allowed
    console.log('\nTEST 3: Guest booking with unknown (unregistered) email');
    const r3 = await post('/api/bookings/guest', {
      roomId: room.id, checkInDate: '2026-09-15', checkOutDate: '2026-09-17',
      guestName: 'Unknown Guest', guestEmail: 'totallynewperson@example.com',
      guestPhone: '0922222222', totalPrice: 4000
    });
    console.log('  Status:', r3.status, '(expected 201 or 400 if room now occupied)');
    console.log(' ', r3.status === 201 ? '✅ PASS: Unregistered email allowed' : `Info: ${r3.body.error}`);

    // Restore test email to verified
    await sequelize.query(`UPDATE "Users" SET "emailVerified"=true WHERE email='mikiyasmelese336@gmail.com'`);
    console.log('\nRestored mikiyasmelese336@gmail.com → emailVerified=true');
    console.log('\n=== Test complete ===');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
})();
