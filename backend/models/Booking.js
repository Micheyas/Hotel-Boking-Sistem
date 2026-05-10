const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Rooms',
      key: 'id',
    },
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
    defaultValue: 'pending',
  },
  bookingType: {
    type: DataTypes.ENUM('online', 'manual', 'guest'),
    defaultValue: 'online',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Booking;