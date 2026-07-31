const sequelize = require('../config/database');
const Room = require('./Room');
const RoomType = require('./RoomType');
const User = require('./User');
const Booking = require('./Booking');
const ExchangeRate = require('./ExchangeRate');
const Offer = require('./Offer');
const Review = require('./Review');
const HotelService = require('./HotelService');
const ITRequest = require('./ITRequest');

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

HotelService.hasMany(Review, { foreignKey: 'serviceId', as: 'reviews' });
Review.belongsTo(HotelService, { foreignKey: 'serviceId', as: 'service' });

// IT Request associations
User.hasMany(ITRequest, { foreignKey: 'requestedBy', as: 'itRequests' });
ITRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });

User.hasMany(ITRequest, { foreignKey: 'approvedBy', as: 'approvedRequests' });
ITRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

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
  ITRequest,
};
