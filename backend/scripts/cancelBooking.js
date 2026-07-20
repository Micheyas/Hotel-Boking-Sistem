require('dotenv').config();
const sequelize = require('../config/database');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const BOOKING_ID = 5; // change this to cancel a different booking

async function cancel() {
  await sequelize.authenticate();

  const booking = await Booking.findByPk(BOOKING_ID);
  if (!booking) {
    console.log(`❌ Booking #${BOOKING_ID} not found.`);
    process.exit(1);
  }

  console.log(`Found booking #${booking.id} — status: ${booking.status}, roomId: ${booking.roomId}`);

  if (booking.status === 'cancelled') {
    console.log(`⚠️  Booking #${BOOKING_ID} is already cancelled.`);
    process.exit(0);
  }

  // Free the room back to available
  await Room.update({ status: 'available' }, { where: { id: booking.roomId } });

  // Cancel the booking — record is PRESERVED in history (not deleted)
  await booking.update({
    status: 'cancelled',
    receptionNotes: (booking.receptionNotes ? booking.receptionNotes + ' | ' : '') +
      `Manually cancelled via script on ${new Date().toISOString()}.`,
  });

  console.log(`✅ Booking #${BOOKING_ID} cancelled. Room ${booking.roomId} set to available. Record preserved in history.`);
  process.exit(0);
}

cancel().catch(e => { console.error('Error:', e.message); process.exit(1); });
