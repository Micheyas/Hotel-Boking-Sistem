const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');

async function seedDatabase() {
  try {
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const managerPassword = await bcrypt.hash('manager123', salt);
    const receptionPassword = await bcrypt.hash('receptionist123', salt);

    // Create staff users
    const users = await Promise.all([
      User.create({
        name: 'Admin User',
        email: 'admin@hotel.com',
        password: adminPassword,
        role: 'admin',
      }),
      User.create({
        name: 'Manager User',
        email: 'manager@hotel.com',
        password: managerPassword,
        role: 'manager',
      }),
      User.create({
        name: 'Receptionist User',
        email: 'receptionist@hotel.com',
        password: receptionPassword,
        role: 'receptionist',
      }),
    ]);

    console.log('✅ Staff users created:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}): ${user.email}`);
    });

    // Create room types
    const roomTypes = await Promise.all([
      RoomType.create({
        name: 'Standard Room',
        description: 'Comfortable room with city views, perfect for solo travelers or couples.',
        basePrice: 8500,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
      }),
      RoomType.create({
        name: 'Deluxe Room',
        description: 'Spacious room with Manhattan skyline views and premium amenities.',
        basePrice: 12500,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Breakfast', 'Balcony'],
      }),
      RoomType.create({
        name: 'Executive Suite',
        description: 'Luxury suite with separate living area and panoramic views.',
        basePrice: 19500,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Breakfast', 'Lounge Access', 'City View'],
      }),
      RoomType.create({
        name: 'Penthouse Suite',
        description: 'Ultimate luxury with rooftop access and private terrace.',
        basePrice: 35000,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Breakfast', 'Butler Service', 'Rooftop Access', 'Private Terrace'],
      }),
    ]);

    console.log('\n✅ Room types created:');
    roomTypes.forEach(type => {
      console.log(`  - ${type.name}: ${type.basePrice} ETB`);
    });

    // Create rooms for each type
    const rooms = [];
    for (let floor = 1; floor <= 5; floor++) {
      for (let room = 1; room <= 10; room++) {
        const roomNumber = `${floor}0${room}`;
        const roomTypeId = roomTypes[Math.floor(Math.random() * roomTypes.length)].id;
        rooms.push({
          roomNumber,
          roomTypeId,
          status: 'available',
          floor,
        });
      }
    }

    await Room.bulkCreate(rooms);
    console.log(`\n✅ ${rooms.length} rooms created`);

    console.log('\n🎉 Database seeding completed!');
    console.log('\nStaff login credentials:');
    console.log('  admin@hotel.com / admin123');
    console.log('  manager@hotel.com / manager123');
    console.log('  receptionist@hotel.com / receptionist123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
