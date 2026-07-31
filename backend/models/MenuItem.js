const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
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
  image: {
    // Cloudinary URL or local path
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  category: {
    // Starter | Main Course | Dessert | Drink | Special | Breakfast | Vegan
    // Also used for service sub-menus: Massage | Facial | Pool | Gym | etc.
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Main Course',
  },
  serviceCategory: {
    // Which hotel service this item belongs to.
    // 'Restaurant' = food menu, 'Wellness & Spa' = spa menu, etc.
    // NULL = restaurant/food items only
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Restaurant',
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
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

module.exports = MenuItem;
