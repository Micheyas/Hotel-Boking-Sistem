/**
 * Seeds 10 restaurant menu items with real food photos from Unsplash.
 * Run: node scripts/seedMenu.js
 */
require('dotenv').config();
const sequelize = require('../config/database');
const MenuItem  = require('../models/MenuItem');

const MENU_ITEMS = [
  {
    name: 'Tibs (Ethiopian Sauté)',
    description: 'Tender beef or lamb cubes sautéed with onions, tomatoes, jalapeños and rosemary — a classic Ethiopian favourite.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    price: 380,
    category: 'Main Course',
    sortOrder: 1,
  },
  {
    name: 'Injera & Wot Platter',
    description: 'Traditional spongy injera flatbread served with three wot stews — doro, misir and gomen — on a single large plate.',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    price: 320,
    category: 'Main Course',
    sortOrder: 2,
  },
  {
    name: 'Grilled Nile Perch',
    description: 'Fresh Nile perch fillet grilled to perfection, served with spiced rice, sautéed vegetables and lemon-herb butter.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
    price: 450,
    category: 'Main Course',
    sortOrder: 3,
  },
  {
    name: 'Avocado & Tomato Salad',
    description: 'Creamy ripe avocado, heirloom tomatoes, red onion and fresh herbs tossed in a light lemon-olive oil dressing.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    price: 180,
    category: 'Starter',
    sortOrder: 1,
  },
  {
    name: 'Lentil Soup',
    description: 'Slow-cooked red lentils spiced with cumin, turmeric and coriander, served with toasted sourdough bread.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
    price: 150,
    category: 'Starter',
    sortOrder: 2,
  },
  {
    name: 'Macchiato & Pastry',
    description: 'Freshly pulled Ethiopian macchiato served alongside a flaky croissant or traditional ambasha bread.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    price: 120,
    category: 'Breakfast',
    sortOrder: 1,
  },
  {
    name: 'Full English Breakfast',
    description: 'Two eggs any style, grilled sausages, streaky bacon, baked beans, grilled tomato and toast.',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    price: 280,
    category: 'Breakfast',
    sortOrder: 2,
  },
  {
    name: 'Mango Juice',
    description: 'Freshly squeezed ripe mango juice — no added sugar, no water. Served chilled with a lime wedge.',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80',
    price: 90,
    category: 'Drink',
    sortOrder: 1,
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm dark-chocolate fondant with a molten centre, dusted with cocoa powder and served with vanilla ice cream.',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    price: 220,
    category: 'Dessert',
    sortOrder: 1,
  },
  {
    name: 'Vegan Buddha Bowl',
    description: 'Quinoa, roasted chickpeas, avocado, shredded purple cabbage, edamame and tahini drizzle — colourful and filling.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
    price: 260,
    category: 'Vegan',
    sortOrder: 1,
  },
];

async function seed() {
  await sequelize.authenticate();
  console.log('Connected to database.\n');

  // Sync table
  await MenuItem.sync({ force: false });

  let added = 0;
  let skipped = 0;

  for (const item of MENU_ITEMS) {
    const existing = await MenuItem.findOne({ where: { name: item.name } });
    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${item.name}`);
      skipped++;
      continue;
    }
    await MenuItem.create({ ...item, available: true });
    console.log(`  ✅ Added: ${item.name} — ${item.price} ETB (${item.category})`);
    added++;
  }

  console.log(`\nDone. ${added} items added, ${skipped} skipped.`);
  process.exit(0);
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });
