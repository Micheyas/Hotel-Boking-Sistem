require('dotenv').config();
const http = require('http');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

async function test() {
  await sequelize.authenticate();

  // 1. Get receptionist token
  const user = await User.findOne({ where: { email: 'receptionist@hotel.com' } });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  console.log('✅ Receptionist token generated, role:', user.role);

  // 2. Find an available room
  const room = await Room.findOne({ where: { status: 'available' } });
  if (!room) { console.log('❌ No available rooms'); process.exit(1); }

  // 3. Create a test booking with proof_submitted
  const booking = await Booking.create({
    roomId: room.id,
    checkInDate: new Date(),
    checkOutDate: new Date(Date.now() + 86400000 * 2),
    totalPrice: 5000,
    status: 'pending',
    paymentStatus: 'proof_submitted',
    paymentProof: '/uploads/payments/test.jpg',
    bookingType: 'guest',
    guestName: 'Test Guest',
    guestEmail: 'test@test.com',
    guestPhone: '0911000000',
  });
  console.log('✅ Test booking created: #', booking.id);

  // 4. Now call verify-proof via HTTP
  const body = JSON.stringify({ action: 'approve' });
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: `/api/payments/${booking.id}/verify-proof`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${token}`,
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', async () => {
      console.log('HTTP Status:', res.statusCode);
      console.log('Response:', data);
      if (res.statusCode === 200) {
        console.log('✅ Payment verification WORKS for receptionist');
      } else {
        console.log('❌ FAILED — this is the real error from the server');
      }
      // Cleanup test booking
      await booking.destroy();
      console.log('🧹 Test booking cleaned up');
      process.exit(0);
    });
  });

  req.on('error', e => {
    console.error('❌ Cannot connect to backend. Is the server running?', e.message);
    process.exit(1);
  });
  req.write(body);
  req.end();
}

test().catch(e => { console.error(e.message); process.exit(1); });
