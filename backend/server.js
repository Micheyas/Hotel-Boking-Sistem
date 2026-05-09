const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const sequelize = require('./config/database');
const socketService = require('./socket');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Sync database
sequelize.sync().then(() => {
  console.log('Database synced');
}).catch(err => console.error('Database sync error:', err));

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketService.init(server);

io.on('connection', () => {
  console.log('Realtime connection established.');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;