const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'receptionist', 'customer'),
    defaultValue: 'customer',
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  verifyToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verifyTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // ── KYC fields ──────────────────────────────────────────
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  idType: {
    // 'national_id' or 'passport'
    type: DataTypes.ENUM('national_id', 'passport'),
    allowNull: true,
  },
  idFront: {
    // Cloudinary URL for front of ID / passport photo page
    type: DataTypes.STRING,
    allowNull: true,
  },
  idBack: {
    // Cloudinary URL for back of national ID (null for passport)
    type: DataTypes.STRING,
    allowNull: true,
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'submitted', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  kycRejectedReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  kycSubmittedAt: {
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

module.exports = User;