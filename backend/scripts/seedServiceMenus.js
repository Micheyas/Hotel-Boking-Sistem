/**
 * Seeds service sub-menus for all hotel service categories.
 * Each category gets 3-5 items with Unsplash photos and ETB prices.
 * Run: node scripts/seedServiceMenus.js
 */
require('dotenv').config();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const MenuItem = require('../models/MenuItem');

const ITEMS = [
  // ── Wellness & Spa ──────────────────────────────────────────────────────
  {
    name: 'Swedish Full-Body Massage',
    description: 'A relaxing 60-minute full-body massage using warm oils to relieve muscle tension and stress.',
    image: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
    price: 1200, category: 'Massage', serviceCategory: 'Wellness & Spa', sortOrder: 1,
  },
  {
    name: 'Deep Tissue Massage',
    description: 'Therapeutic 45-minute deep-tissue massage targeting chronic pain and tight muscles.',
    image: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=800&q=80',
    price: 1400, category: 'Massage', serviceCategory: 'Wellness & Spa', sortOrder: 2,
  },
  {
    name: 'Luxury Facial Treatment',
    description: 'A 50-minute personalised facial using premium skincare products — cleansing, exfoliation and hydration.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
    price: 900, category: 'Facial', serviceCategory: 'Wellness & Spa', sortOrder: 3,
  },
  {
    name: 'Aromatherapy Body Wrap',
    description: 'Nourishing 75-minute body wrap with essential oils to detoxify, soften and rejuvenate skin.',
    image: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=800&q=80',
    price: 1600, category: 'Body Treatment', serviceCategory: 'Wellness & Spa', sortOrder: 4,
  },
  {
    name: 'Couples Spa Package',
    description: 'Two-hour couples retreat — side-by-side massages, facials and a glass of champagne.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    price: 3500, category: 'Package', serviceCategory: 'Wellness & Spa', sortOrder: 5,
  },

  // ── Fitness ─────────────────────────────────────────────────────────────
  {
    name: 'Personal Training Session',
    description: '60-minute one-on-one session with a certified personal trainer — customised workout plan.',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
    price: 800, category: 'Training', serviceCategory: 'Fitness', sortOrder: 1,
  },
  {
    name: 'Guided Yoga Class',
    description: '45-minute group yoga session for all levels — mat and towel provided.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    price: 300, category: 'Classes', serviceCategory: 'Fitness', sortOrder: 2,
  },
  {
    name: 'Pool Lane Reservation',
    description: 'Reserve a private lane in our 25-metre indoor lap pool for 1 hour.',
    image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
    price: 400, category: 'Pool', serviceCategory: 'Fitness', sortOrder: 3,
  },
  {
    name: 'Sauna Session',
    description: 'One-hour access to our traditional Finnish sauna with cold plunge pool.',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
    price: 400, category: 'Sauna', serviceCategory: 'Fitness', sortOrder: 4,
  },

  // ── Transport ────────────────────────────────────────────────────────────
  {
    name: 'Airport Transfer (One Way)',
    description: 'Comfortable air-conditioned sedan transfer between the hotel and Addis Ababa Bole Airport.',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
    price: 600, category: 'Airport', serviceCategory: 'Transport', sortOrder: 1,
  },
  {
    name: 'City Sightseeing Tour (Half Day)',
    description: 'Guided 4-hour city tour in an air-conditioned vehicle covering major landmarks.',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
    price: 1200, category: 'Tours', serviceCategory: 'Transport', sortOrder: 2,
  },
  {
    name: 'Full Day Private Car Hire',
    description: 'Dedicated driver and vehicle for a full day (8 hours) — ideal for business or leisure.',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    price: 2500, category: 'Car Rental', serviceCategory: 'Transport', sortOrder: 3,
  },
  {
    name: 'Entoto Hill Day Trip',
    description: 'Guided full-day excursion to Entoto Natural Park — includes lunch and entrance fees.',
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80',
    price: 1800, category: 'Tours', serviceCategory: 'Transport', sortOrder: 4,
  },

  // ── Facilities ──────────────────────────────────────────────────────────
  {
    name: 'Meeting Room (Half Day)',
    description: 'Air-conditioned meeting room for up to 12 guests — includes projector, whiteboard and coffee.',
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80',
    price: 2000, category: 'Meeting Rooms', serviceCategory: 'Facilities', sortOrder: 1,
  },
  {
    name: 'Conference Hall (Full Day)',
    description: 'Large conference hall for up to 200 delegates — full AV setup, catering available.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
    price: 12000, category: 'Conference', serviceCategory: 'Facilities', sortOrder: 2,
  },
  {
    name: 'Same-Day Laundry',
    description: 'Full wash, dry and fold service returned the same day by 6 PM when dropped off by 9 AM.',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
    price: 250, category: 'Laundry', serviceCategory: 'Facilities', sortOrder: 3,
  },
  {
    name: 'Dry Cleaning (Per Garment)',
    description: 'Professional dry cleaning for suits, dresses and delicate garments — ready in 24 hours.',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
    price: 180, category: 'Laundry', serviceCategory: 'Facilities', sortOrder: 4,
  },
  {
    name: 'Valet Parking (Per Day)',
    description: 'Secure 24-hour valet parking with our uniformed attendants — any vehicle size welcome.',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
    price: 350, category: 'Parking', serviceCategory: 'Facilities', sortOrder: 5,
  },

  // ── Recreation ──────────────────────────────────────────────────────────
  {
    name: 'Kids Club (Full Day)',
    description: 'Supervised indoor and outdoor activities for children aged 4–12 — arts, sports and games.',
    image: 'https://images.unsplash.com/photo-1526634332515-d56c5fd16991?w=800&q=80',
    price: 500, category: 'Kids', serviceCategory: 'Recreation', sortOrder: 1,
  },
  {
    name: 'Billiards & Pool Table (1 Hour)',
    description: 'Private billiards table in our air-conditioned games lounge — equipment provided.',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
    price: 200, category: 'Games', serviceCategory: 'Recreation', sortOrder: 2,
  },
  {
    name: 'Table Tennis (1 Hour)',
    description: 'Dedicated table tennis table — rackets and balls provided for up to 4 players.',
    image: 'https://images.unsplash.com/photo-1611251126112-f4db4fe28b63?w=800&q=80',
    price: 150, category: 'Games', serviceCategory: 'Recreation', sortOrder: 3,
  },
  {
    name: 'Library Day Pass',
    description: 'Full-day access to our curated reading lounge with 1,000+ books, periodicals and quiet booths.',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&q=80',
    price: 0, category: 'Library', serviceCategory: 'Recreation', sortOrder: 4,
  },
];

async function run() {
  await sequelize.authenticate();
  console.log('Connected.\n');

  // Add serviceCategory column if it doesn't exist
  const qi = sequelize.getQueryInterface();
  try {
    await qi.addColumn('MenuItems', 'serviceCategory', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Restaurant',
    });
    // Also set existing restaurant items
    await sequelize.query(`UPDATE "MenuItems" SET "serviceCategory" = 'Restaurant' WHERE "serviceCategory" IS NULL`);
    console.log('✅ Added serviceCategory column\n');
  } catch (e) {
    console.log('ℹ️  serviceCategory column already exists\n');
  }

  let added = 0, skipped = 0;

  for (const item of ITEMS) {
    const existing = await MenuItem.findOne({ where: { name: item.name, serviceCategory: item.serviceCategory } });
    if (existing) {
      console.log(`  ⏭  Skipped: ${item.serviceCategory} | ${item.name}`);
      skipped++;
      continue;
    }
    await MenuItem.create({ ...item, available: true });
    console.log(`  ✅ ${item.serviceCategory} | ${item.name} — ${item.price} ETB`);
    added++;
  }

  console.log(`\nDone. ${added} items added, ${skipped} skipped.`);
  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
