const { HotelService } = require('../models');
const { Op } = require('sequelize');

// Default seed data — used to pre-populate the table on first run
const DEFAULT_SERVICES = [
  // ── Food & Beverage ──
  { name: 'Restaurant', description: 'Fine dining with local and international cuisine, crafted by our award-winning chefs.', category: 'Food & Beverage', icon: '🍽️', price: null, priceLabel: 'À la carte', availableFrom: '06:30', availableTo: '22:30', location: 'Ground Floor — Main Dining Hall', sortOrder: 1 },
  { name: 'Sky Bar & Lounge', description: 'Panoramic rooftop bar offering handcrafted cocktails, wines, and stunning city views.', category: 'Food & Beverage', icon: '🍸', price: null, priceLabel: 'À la carte', availableFrom: '16:00', availableTo: '00:00', location: 'Rooftop — Floor 12', sortOrder: 2 },
  { name: 'Café & Bakery', description: 'Fresh pastries, artisan coffees, and light snacks served all day.', category: 'Food & Beverage', icon: '☕', price: null, priceLabel: 'À la carte', availableFrom: '06:00', availableTo: '20:00', location: 'Lobby Level', sortOrder: 3 },
  { name: 'Room Service', description: '24-hour in-room dining from our full restaurant menu.', category: 'Food & Beverage', icon: '🛎️', price: null, priceLabel: 'À la carte', availableFrom: '00:00', availableTo: '23:59', location: 'All Rooms', sortOrder: 4 },
  { name: 'Mini Bar', description: 'In-room mini bar stocked with beverages, snacks, and premium spirits.', category: 'Food & Beverage', icon: '🍾', price: null, priceLabel: 'Per item', availableFrom: '00:00', availableTo: '23:59', location: 'All Rooms', sortOrder: 5 },

  // ── Wellness & Spa ──
  { name: 'Spa & Wellness Center', description: 'Full-service spa with massages, facials, body wraps, and aromatherapy treatments.', category: 'Wellness & Spa', icon: '💆', price: 1200, priceLabel: 'from 1,200 ETB / session', availableFrom: '09:00', availableTo: '20:00', location: 'Floor 2 — Spa Wing', sortOrder: 10 },
  { name: 'Sauna & Steam Room', description: 'Traditional Finnish sauna and steam room for ultimate relaxation.', category: 'Wellness & Spa', icon: '🧖', price: 400, priceLabel: '400 ETB / hour', availableFrom: '07:00', availableTo: '21:00', location: 'Floor 2 — Spa Wing', sortOrder: 11 },
  { name: 'Jacuzzi & Hot Tub', description: 'Private jacuzzi suites and shared hot tub with hydrotherapy jets.', category: 'Wellness & Spa', icon: '♨️', price: 600, priceLabel: '600 ETB / hour', availableFrom: '08:00', availableTo: '22:00', location: 'Floor 2 — Pool Area', sortOrder: 12 },

  // ── Fitness ──
  { name: 'Fitness Center & Gym', description: 'State-of-the-art gym with free weights, cardio machines, and personal trainers.', category: 'Fitness', icon: '🏋️', price: null, priceLabel: 'Complimentary for guests', availableFrom: '05:00', availableTo: '23:00', location: 'Floor 1 — East Wing', sortOrder: 20 },
  { name: 'Swimming Pool', description: 'Heated outdoor pool and indoor lap pool, open year-round.', category: 'Fitness', icon: '🏊', price: null, priceLabel: 'Complimentary for guests', availableFrom: '06:00', availableTo: '22:00', location: 'Floor 1 — Pool Deck', sortOrder: 21 },
  { name: 'Yoga & Meditation', description: 'Daily guided yoga and meditation classes for all skill levels.', category: 'Fitness', icon: '🧘', price: 300, priceLabel: '300 ETB / class', availableFrom: '07:00', availableTo: '19:00', location: 'Floor 2 — Wellness Studio', sortOrder: 22 },

  // ── Transport ──
  { name: 'Airport Shuttle', description: 'Comfortable and punctual airport transfers in air-conditioned vehicles.', category: 'Transport', icon: '🚐', price: 800, priceLabel: '800 ETB per trip', availableFrom: '00:00', availableTo: '23:59', location: 'Hotel Entrance — advance booking required', sortOrder: 30 },
  { name: 'Car Rental', description: 'Daily car rental with a choice of sedans, SUVs, and luxury vehicles.', category: 'Transport', icon: '🚗', price: 2500, priceLabel: 'from 2,500 ETB / day', availableFrom: '07:00', availableTo: '20:00', location: 'Concierge Desk', sortOrder: 31 },
  { name: 'City Tour', description: 'Guided half-day and full-day city tours with a professional guide.', category: 'Transport', icon: '🗺️', price: 1500, priceLabel: 'from 1,500 ETB / person', availableFrom: '08:00', availableTo: '18:00', location: 'Concierge Desk', sortOrder: 32 },

  // ── Facilities ──
  { name: 'Business Center', description: 'Fully equipped business center with printing, scanning, and high-speed internet.', category: 'Facilities', icon: '💼', price: null, priceLabel: 'Complimentary for guests', availableFrom: '07:00', availableTo: '22:00', location: 'Floor 1 — Business Lounge', sortOrder: 40 },
  { name: 'Conference Rooms', description: 'Modern meeting and conference rooms for 10–200 guests with AV equipment.', category: 'Facilities', icon: '🏢', price: 5000, priceLabel: 'from 5,000 ETB / half-day', availableFrom: '08:00', availableTo: '20:00', location: 'Floor 3 — Conference Center', sortOrder: 41 },
  { name: 'Laundry & Dry Cleaning', description: 'Same-day laundry and dry cleaning service for all garments.', category: 'Facilities', icon: '👔', price: 200, priceLabel: 'from 200 ETB / item', availableFrom: '07:00', availableTo: '18:00', location: 'Request via Reception', sortOrder: 42 },
  { name: 'Concierge Service', description: 'Our concierge team is available 24/7 to arrange bookings, tours, and special requests.', category: 'Facilities', icon: '🛎️', price: null, priceLabel: 'Complimentary', availableFrom: '00:00', availableTo: '23:59', location: 'Lobby — Concierge Desk', sortOrder: 43 },
  { name: 'Valet Parking', description: 'Secure valet parking service for all hotel guests.', category: 'Facilities', icon: '🅿️', price: 150, priceLabel: '150 ETB / night', availableFrom: '00:00', availableTo: '23:59', location: 'Hotel Main Entrance', sortOrder: 44 },

  // ── Recreation ──
  { name: 'Kids Club', description: 'Supervised indoor and outdoor activities for children aged 4–12.', category: 'Recreation', icon: '🎠', price: null, priceLabel: 'Complimentary', availableFrom: '09:00', availableTo: '18:00', location: 'Floor 1 — Garden Level', sortOrder: 50 },
  { name: 'Games Room', description: 'Pool table, table tennis, arcade games, and board games for all ages.', category: 'Recreation', icon: '🎱', price: null, priceLabel: 'Complimentary for guests', availableFrom: '10:00', availableTo: '23:00', location: 'Floor B1 — Recreation Center', sortOrder: 51 },
  { name: 'Library & Reading Lounge', description: 'Quiet reading lounge with a curated selection of books and periodicals.', category: 'Recreation', icon: '📚', price: null, priceLabel: 'Complimentary', availableFrom: '08:00', availableTo: '22:00', location: 'Floor 1 — East Lounge', sortOrder: 52 },
];

// GET /api/services  — public (active services only)
exports.getPublicServices = async (req, res) => {
  try {
    const { category } = req.query;
    const where = { status: 'active' };
    if (category) where.category = category;

    const services = await HotelService.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['category', 'ASC'], ['name', 'ASC']],
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/services/all  — staff (all services including inactive)
exports.getAllServices = async (req, res) => {
  try {
    const services = await HotelService.findAll({
      order: [['sortOrder', 'ASC'], ['category', 'ASC'], ['name', 'ASC']],
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/services/categories  — public list of distinct active categories
exports.getCategories = async (req, res) => {
  try {
    const services = await HotelService.findAll({
      where: { status: 'active' },
      attributes: ['category'],
    });
    const cats = [...new Set(services.map(s => s.category))].sort();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/services  — admin/manager only
exports.createService = async (req, res) => {
  try {
    const {
      name, description, category, icon, price, priceLabel,
      availableFrom, availableTo, availableDays, location, status, sortOrder,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'name and category are required.' });
    }

    const service = await HotelService.create({
      name,
      description: description || '',
      category,
      icon: icon || '🏨',
      price: price !== '' && price != null ? Number(price) : null,
      priceLabel: priceLabel || '',
      availableFrom: availableFrom || '',
      availableTo: availableTo || '',
      availableDays: Array.isArray(availableDays)
        ? JSON.stringify(availableDays)
        : (availableDays || '["Daily"]'),
      location: location || '',
      status: status || 'active',
      sortOrder: sortOrder != null ? Number(sortOrder) : 0,
    });
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/services/:id  — admin/manager only
exports.updateService = async (req, res) => {
  try {
    const service = await HotelService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    const {
      name, description, category, icon, price, priceLabel,
      availableFrom, availableTo, availableDays, location, status, sortOrder,
    } = req.body;

    await service.update({
      name:          name          ?? service.name,
      description:   description   ?? service.description,
      category:      category      ?? service.category,
      icon:          icon          ?? service.icon,
      price:         (price !== '' && price != null) ? Number(price) : null,
      priceLabel:    priceLabel    ?? service.priceLabel,
      availableFrom: availableFrom ?? service.availableFrom,
      availableTo:   availableTo   ?? service.availableTo,
      availableDays: Array.isArray(availableDays)
        ? JSON.stringify(availableDays)
        : (availableDays ?? service.availableDays),
      location:      location      ?? service.location,
      status:        status        ?? service.status,
      sortOrder:     sortOrder != null ? Number(sortOrder) : service.sortOrder,
    });
    res.json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/services/:id  — admin only
exports.deleteService = async (req, res) => {
  try {
    const service = await HotelService.findByPk(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    await service.destroy();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Seed default services — called from server.js after sync
exports.seedDefaultServices = async () => {
  const count = await HotelService.count();
  if (count === 0) {
    await HotelService.bulkCreate(DEFAULT_SERVICES);
    console.log(`Seeded ${DEFAULT_SERVICES.length} default hotel services`);
  }
};
