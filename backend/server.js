const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Disable SSL certificate verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require('path');
const { sequelize } = require('./models');
const socketService = require('./socket');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/currency', require('./routes/currency'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reviews', require('./routes/reviews'));

app.get('/', (req, res) => {
  res.json({ message: 'Hotel Booking API is running' });
});

// Sync database and seed if needed
const seedData = async () => {
  const { Room, RoomType } = require('./models');

  // Only seed room types if none exist
  let roomTypes = await RoomType.findAll();
  if (roomTypes.length === 0) {
    roomTypes = await RoomType.bulkCreate([
      { name: 'Standard Room', basePrice: 2000, description: 'Basic comfortable room with essential amenities' },
      { name: 'Deluxe Room',   basePrice: 3500, description: 'Spacious room with premium amenities' },
      { name: 'Suite',         basePrice: 5500, description: 'Luxurious suite with separate living area' },
    ]);
    console.log('Room types seeded');
  }

  // Only seed rooms if none exist — never reset or wipe existing rooms
  const roomCount = await Room.count();
  if (roomCount === 0) {
    const rooms = [];
    const [standard, deluxe, suite] = roomTypes;

    for (let i = 1; i <= 10; i++) rooms.push({ roomNumber: `10${i}`, roomTypeId: standard.id, floor: 1, status: 'available' });
    for (let i = 1; i <= 8;  i++) rooms.push({ roomNumber: `20${i}`, roomTypeId: deluxe.id,   floor: 2, status: 'available' });
    for (let i = 1; i <= 5;  i++) rooms.push({ roomNumber: `30${i}`, roomTypeId: suite.id,    floor: 3, status: 'available' });

    await Room.bulkCreate(rooms);
    console.log(`${rooms.length} rooms seeded`);
  } else {
    console.log(`${roomCount} rooms already in database — skipping room seed`);
  }
};

sequelize.sync({ alter: false }).then(async () => {
  console.log('Database synced');

  // Safely add new columns if they don't exist yet (avoids alter:true FK issues)
  const qi = sequelize.getQueryInterface();
  const addColumnIfMissing = async (table, column, definition) => {
    try {
      await qi.addColumn(table, column, definition);
      console.log(`Added column ${table}.${column}`);
    } catch (e) {
      // Column already exists — ignore
    }
  };

  const { DataTypes } = require('sequelize');
  await addColumnIfMissing('Bookings', 'paymentProof',   { type: DataTypes.STRING,  allowNull: true });
  await addColumnIfMissing('Bookings', 'paymentStatus',  { type: DataTypes.STRING,  allowNull: true, defaultValue: 'unpaid' });
  await addColumnIfMissing('Rooms', 'maxGuests',   { type: DataTypes.INTEGER, allowNull: true, defaultValue: 2 });
  await addColumnIfMissing('Rooms', 'roomSize',    { type: DataTypes.STRING,  allowNull: true });
  await addColumnIfMissing('Rooms', 'bedType',     { type: DataTypes.STRING,  allowNull: true });
  await addColumnIfMissing('Rooms', 'description', { type: DataTypes.TEXT,    allowNull: true });
  await addColumnIfMissing('Rooms', 'images',      { type: DataTypes.TEXT,    allowNull: true, defaultValue: '[]' });

  // Clean up orphaned bookings that reference deleted rooms
  try {
    const { Booking, Room } = require('./models');
    const roomIds = (await Room.findAll({ attributes: ['id'] })).map(r => r.id);
    if (roomIds.length > 0) {
      const deleted = await Booking.destroy({
        where: { roomId: { [require('sequelize').Op.notIn]: roomIds } }
      });
      if (deleted > 0) console.log(`Cleaned up ${deleted} orphaned booking(s)`);
    }
  } catch (e) {
    console.warn('Could not clean orphaned bookings:', e.message);
  }

  await seedData();

  // ── Auto-delete pending bookings older than 5 minutes ──
  // Runs every 60 seconds. Any booking still 'pending' after 5 min
  // gets deleted and its room is freed back to 'available'.
  const startPendingCleanup = () => {
    const { Booking, Room } = require('./models');
    const { Op } = require('sequelize');

    const cleanup = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Only delete pending bookings that have NO payment proof uploaded.
        // If a screenshot was submitted, keep the booking alive for receptionist review.
        const expired = await Booking.findAll({
          where: {
            status: 'pending',
            paymentProof: null,          // no screenshot uploaded yet
            paymentStatus: 'unpaid',     // payment not started
            createdAt: { [Op.lt]: fiveMinutesAgo },
          },
        });

        if (expired.length === 0) return;

        // Free each room back to available
        for (const booking of expired) {
          await Room.update(
            { status: 'available' },
            { where: { id: booking.roomId } }
          );
        }

        // Delete the expired bookings
        const ids = expired.map(b => b.id);
        await Booking.destroy({ where: { id: { [Op.in]: ids } } });

        console.log(`[Cleanup] Deleted ${expired.length} expired pending booking(s): IDs ${ids.join(', ')}`);

        // Notify connected clients so the room grid updates live
        io.emit('roomsUpdated');
      } catch (err) {
        console.warn('[Cleanup] Error during pending booking cleanup:', err.message);
      }
    };

    // Run immediately on startup, then every 60 seconds
    cleanup();
    setInterval(cleanup, 60 * 1000);
    console.log('✅ Pending booking auto-cleanup started (5 min expiry, checks every 60s)');
  };

  startPendingCleanup();

  // Pre-warm currency rates cache on startup
  try {
    const currencyController = require('./controllers/currencyController');
    await currencyController.warmCache();
  } catch (e) {
    console.warn('[Currency] Startup warm failed:', e.message);
  }
  
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  const io = socketService.init(server);

  io.on('connection', () => {
    console.log('Realtime connection established.');
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;