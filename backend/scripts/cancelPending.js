require('dotenv').config();
const sequelize = require('../config/database');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

async function cancelAllPending() {
  await sequelize.authenticate();

  // Find all pending bookings
  const pending = await Booking.findAll({ where: { status: 'pending' } });

  if (pending.length === 0) {
    console.log('✅ No pending bookings found.');
    process.exit(0);
  }

  console.log(`Found ${pending.length} pending booking(s). Cancelling...`);

  for (const booking of pending) {
    // Free the room back to available
    await Room.update({ status: 'available' }, { where: { id: booking.roomId } });
    // Delete the booking
    await booking.destroy();
    console.log(`  ❌ Deleted booking #${booking.id} (Room ${booking.roomId}) — room set to available`);
  }

  console.log(`\n✅ Done. ${pending.length} pending booking(s) removed.`);
  process.exit(0);
}

cancelAllPending().catch(e => { console.error('Error:', e.message); process.exit(1); });
