const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionUri = process.env.DATABASE_URL;

const isRemoteOrSSL = !!(
  (process.env.DB_SSL && process.env.DB_SSL === 'true') ||
  (connectionUri && !connectionUri.includes('localhost') && !connectionUri.includes('127.0.0.1')) ||
  (process.env.DB_HOST && (
    process.env.DB_HOST.includes('supabase.co') ||
    process.env.DB_HOST.includes('supabase.com') ||
    process.env.DB_HOST.includes('neon.tech') ||
    process.env.DB_HOST.includes('render.com') ||
    process.env.DB_HOST.includes('railway.app') ||
    process.env.DB_HOST.includes('aivencloud.com')
  ))
);

const dialectOptions = isRemoteOrSSL
  ? {
      ssl: { require: true, rejectUnauthorized: false },
      keepAlive: true,
    }
  : {};

const poolConfig = {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

let sequelize;

if (connectionUri) {
  sequelize = new Sequelize(connectionUri, {
    dialect: 'postgres',
    logging: false,
    dialectOptions,
    pool: poolConfig,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions,
      pool: poolConfig,
    }
  );
}

module.exports = sequelize;
