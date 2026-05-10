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