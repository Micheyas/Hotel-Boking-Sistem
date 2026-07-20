const sequelize = require('../config/database');
const Room = require('./Room');
const RoomType = require('./RoomType');
const User = require('./User');
const Booking = require('./Booking');
const ExchangeRate = require('./ExchangeRate');
const Offer = require('./Offer');
const Review = require('./Review');
const HotelService = require('./HotelService');

// Define associations
Room.belongsTo(RoomType, { foreignKey: 'roomTypeId', as: 'roomType' });
RoomType.hasMany(Room, { foreignKey: 'roomTypeId', as: 'rooms' });

Room.hasMany(Booking, { foreignKey: 'roomId', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Association for receptionist who processed the booking
User.hasMany(Booking, { foreignKey: 'processedBy', as: 'processedBookings' });
Booking.belongsTo(User, { foreignKey: 'processedBy', as: 'processedByUser' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Room.hasMany(Review, { foreignKey: 'roomId', as: 'reviews' });
Review.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

module.exports = {
  sequelize,
  Room,
  RoomType,
  User,
  Booking,
  ExchangeRate,
  Offer,
  Review,
  HotelService,
};
