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

  console.log(`Found ${pending.length} pending booking(s). Cancelling (records will be preserved in history)...`);

  for (const booking of pending) {
    // Free the room back to available
    await Room.update({ status: 'available' }, { where: { id: booking.roomId } });

    // Cancel the booking — do NOT destroy, record stays in history
    await booking.update({
      status: 'cancelled',
      receptionNotes: (booking.receptionNotes ? booking.receptionNotes + ' | ' : '') +
        `Manually cancelled via cancelPending script on ${new Date().toISOString()}.`,
    });

    console.log(`  ✅ Cancelled booking #${booking.id} (Room ${booking.roomId}) — record preserved.`);
  }

  console.log(`\n✅ Done. ${pending.length} pending booking(s) cancelled. All records preserved in history.`);
  process.exit(0);
}

cancelAllPending().catch(e => { console.error('Error:', e.message); process.exit(1); });
