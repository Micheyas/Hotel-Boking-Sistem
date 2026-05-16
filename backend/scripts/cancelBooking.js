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

  // Free the room
  await Room.update({ status: 'available' }, { where: { id: booking.roomId } });

  // Delete the booking
  await booking.destroy();

  console.log(`✅ Booking #${BOOKING_ID} deleted. Room ${booking.roomId} set to available.`);
  process.exit(0);
}

cancel().catch(e => { console.error('Error:', e.message); process.exit(1); });
