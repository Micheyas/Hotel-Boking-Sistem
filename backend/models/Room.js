const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  roomTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'RoomTypes',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance'),
    defaultValue: 'available',
  },
  floor: {
    type: DataTypes.INTEGER,
  },
  image: {
    type: DataTypes.STRING,
  },
  images: {
    type: DataTypes.TEXT, // JSON array of up to 3 image paths
    defaultValue: '[]',
  },
  amenities: {
    type: DataTypes.TEXT,
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  roomSize: {
    type: DataTypes.STRING,
  },
  bedType: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
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

module.exports = Room;