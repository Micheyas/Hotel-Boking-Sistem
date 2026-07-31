const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HotelService = sequelize.define('HotelService', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    // Food & Beverage | Wellness & Spa | Fitness | Transport | Facilities | Recreation | Other
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Other',
  },
  icon: {
    // Emoji or icon identifier e.g. "🍽️"
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '🏨',
  },
  price: {
    // Null = complimentary/free
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  priceLabel: {
    // e.g. "per person", "per hour", "from 500 ETB", "complimentary"
    type: DataTypes.STRING,
    allowNull: true,
  },
  availableFrom: {
    // HH:MM e.g. "06:00"
    type: DataTypes.STRING,
    allowNull: true,
  },
  availableTo: {
    // HH:MM e.g. "22:00"
    type: DataTypes.STRING,
    allowNull: true,
  },
  availableDays: {
    // JSON array e.g. ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] or "Daily"
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '["Daily"]',
  },
  location: {
    // e.g. "Floor 3 — Pool Deck", "Lobby Bar"
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
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

module.exports = HotelService;
