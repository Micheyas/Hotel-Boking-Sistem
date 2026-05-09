const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const Offer = require('../models/Offer');
const ExchangeRate = require('../models/ExchangeRate');

const seed = async () => {
  try {
    console.log('Syncing database...');
    await sequelize.sync({ force: true });

    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const managerPassword = await bcrypt.hash('manager123', 10);
    const receptionistPassword = await bcrypt.hash('receptionist123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@hotel.com',
      password: adminPassword,
      role: 'admin',
    });

    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@hotel.com',
      password: managerPassword,
      role: 'manager',
    });

    const receptionist = await User.create({
      name: 'Receptionist User',
      email: 'receptionist@hotel.com',
      password: receptionistPassword,
      role: 'receptionist',
    });

    const customer = await User.create({
      name: 'John Customer',
      email: 'customer@hotel.com',
      password: customerPassword,
      role: 'customer',
    });

    console.log('Creating room types...');
    const standard = await RoomType.create({
      name: 'Standard Room',
      description: 'Basic comfortable room with essential amenities',
      basePrice: 2000,
      amenities: JSON.stringify(['WiFi', 'AC', 'TV', 'Private Bathroom']),
    });

    const deluxe = await RoomType.create({
      name: 'Deluxe Room',
      description: 'Spacious room with premium amenities',
      basePrice: 3500,
      amenities: JSON.stringify(['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Workspace']),
    });

    const suite = await RoomType.create({
      name: 'Suite',
      description: 'Luxurious suite with separate living area',
      basePrice: 5500,
      amenities: JSON.stringify(['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Living Area', 'Bathtub']),
    });

    console.log('Creating rooms...');
    // Standard rooms
    for (let i = 1; i <= 10; i++) {
      await Room.create({
        roomNumber: `10${i}`,
        roomTypeId: standard.id,
        floor: 1,
        status: 'available',
      });
    }

    // Deluxe rooms
    for (let i = 1; i <= 8; i++) {
      await Room.create({
        roomNumber: `20${i}`,
        roomTypeId: deluxe.id,
        floor: 2,
        status: 'available',
      });
    }

    // Suite rooms
    for (let i = 1; i <= 5; i++) {
      await Room.create({
        roomNumber: `30${i}`,
        roomTypeId: suite.id,
        floor: 3,
        status: 'available',
      });
    }

    console.log('Creating offers...');
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Offer.create({
      name: 'Early Bird Discount',
      description: 'Book 7 days in advance and save 15%',
      promoCode: 'EARLYBIRD15',
      discountType: 'percentage',
      discountValue: 15,
      minNights: 3,
      startDate: today,
      endDate: nextMonth,
      status: 'active',
      createdBy: admin.id,
    });

    await Offer.create({
      name: 'Weekend Special',
      description: 'Stay 2 nights on weekends, get 20% off',
      promoCode: 'WEEKEND20',
      discountType: 'percentage',
      discountValue: 20,
      minNights: 2,
      startDate: today,
      endDate: nextMonth,
      status: 'active',
      createdBy: admin.id,
    });

    await Offer.create({
      name: 'Summer Promotion',
      description: 'Flat 500 ETB off for any booking',
      promoCode: 'SUMMER500',
      discountType: 'fixed',
      discountValue: 500,
      minNights: 1,
      startDate: today,
      endDate: nextMonth,
      status: 'active',
      createdBy: admin.id,
    });

    console.log('Creating exchange rates...');
    await ExchangeRate.create({
      baseCurrency: 'ETB',
      targetCurrency: 'USD',
      rate: 0.0088,
      lastUpdated: today,
    });

    await ExchangeRate.create({
      baseCurrency: 'ETB',
      targetCurrency: 'GBP',
      rate: 0.0070,
      lastUpdated: today,
    });

    await ExchangeRate.create({
      baseCurrency: 'ETB',
      targetCurrency: 'EUR',
      rate: 0.0082,
      lastUpdated: today,
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('Admin - admin@hotel.com / admin123');
    console.log('Manager - manager@hotel.com / manager123');
    console.log('Receptionist - receptionist@hotel.com / receptionist123');
    console.log('Customer - customer@hotel.com / customer123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();