const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExchangeRate = sequelize.define('ExchangeRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  baseCurrency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'ETB',
  },
  targetCurrency: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  rate: {
    type: DataTypes.DECIMAL(15, 6),
    allowNull: false,
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = ExchangeRate;