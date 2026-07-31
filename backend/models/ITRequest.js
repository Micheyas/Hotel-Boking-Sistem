const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ITRequest = sequelize.define('ITRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('create', 'reset', 'delete'),
    allowNull: false,
  },
  targetEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetRole: {
    type: DataTypes.ENUM('admin', 'manager', 'receptionist', 'it'),
    allowNull: true, // null for delete requests
  },
  newPassword: {
    type: DataTypes.STRING,
    allowNull: true, // only for create/reset
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  requestedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
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

module.exports = ITRequest;
