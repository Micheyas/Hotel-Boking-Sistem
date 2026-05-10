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
  
  // Check if we have room types
  let roomTypes = await RoomType.findAll();
  if (roomTypes.length === 0) {
    roomTypes = await RoomType.bulkCreate([
      { name: 'Standard', basePrice: 100, description: 'Comfortable standard room' },
      { name: 'Deluxe', basePrice: 150, description: 'Spacious deluxe room' },
      { name: 'Suite', basePrice: 250, description: 'Luxury suite with view' },
    ]);
    console.log('Room types seeded');
  }
  
  // Check if we need rooms
  const roomCount = await Room.count();
  if (roomCount === 0) {
    const rooms = [];
    roomTypes.forEach((type) => {
      for (let floor = 1; floor <= 3; floor++) {
        for (let num = 1; num <= 5; num++) {
          rooms.push({
            roomNumber: `${floor}0${num}`,
            roomTypeId: type.id,
            floor,
            status: 'available',
          });
        }
      }
    });
    await Room.bulkCreate(rooms);
    console.log(`${rooms.length} rooms seeded`);
  } else {
    // Reset all rooms to available (for testing)
    await Room.update({ status: 'available' }, { where: {} });
    console.log('All rooms reset to available');
  }
};

sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced');
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