/**
 * Adds an 'image' column to HotelServices and sets a real Unsplash photo
 * for every existing service.
 * Run: node scripts/addServiceImages.js
 */
require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const HotelService = require('../models/HotelService');

// Curated Unsplash photos — 800×600 for fast loading
const SERVICE_IMAGES = {
  // Food & Beverage
  'Restaurant':        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  'Sky Bar & Lounge':  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80',
  'Café & Bakery':     'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  'Room Service':      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
  'Mini Bar':          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',

  // Wellness & Spa
  'Spa & Wellness Center': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  'Sauna & Steam Room':    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
  'Jacuzzi & Hot Tub':     'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',

  // Fitness
  'Fitness Center & Gym':  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'Swimming Pool':         'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
  'Yoga & Meditation':     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',

  // Transport
  'Airport Shuttle':  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  'Car Rental':       'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
  'City Tour':        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',

  // Facilities
  'Business Center':       'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'Conference Rooms':      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80',
  'Laundry & Dry Cleaning':'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
  'Concierge Service':     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'Valet Parking':         'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',

  // Recreation
  'Kids Club':               'https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=800&q=80',
  'Games Room':              'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
  'Library & Reading Lounge':'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80',
};

async function run() {
  await sequelize.authenticate();
  console.log('Connected.\n');

  // Add image column if it doesn't exist
  const qi = sequelize.getQueryInterface();
  try {
    await qi.addColumn('HotelServices', 'image', {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log('✅ Added image column to HotelServices\n');
  } catch (e) {
    console.log('ℹ️  image column already exists\n');
  }

  // Update each service with its photo
  const services = await HotelService.findAll();
  let updated = 0;
  let skipped = 0;

  for (const svc of services) {
    const img = SERVICE_IMAGES[svc.name];
    if (!img) {
      console.log(`  ⏭  No image mapped for: ${svc.name}`);
      skipped++;
      continue;
    }
    await sequelize.query(
      `UPDATE "HotelServices" SET image = :img WHERE id = :id`,
      { replacements: { img, id: svc.id } }
    );
    console.log(`  ✅ ${svc.category} | ${svc.name}`);
    updated++;
  }

  console.log(`\nDone. ${updated} services updated, ${skipped} skipped.`);
  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
