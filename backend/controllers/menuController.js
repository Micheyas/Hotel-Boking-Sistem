const { MenuItem } = require('../models');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MENU_CATEGORIES = ['Starter', 'Main Course', 'Dessert', 'Drink', 'Breakfast', 'Vegan', 'Special'];

// ── GET /api/menu  (public) ───────────────────────────────────────────────────
// Returns menu items — optionally filtered by serviceCategory
exports.getPublicMenu = async (req, res) => {
  try {
    const { category, serviceCategory } = req.query;
    const where = { available: true };
    if (category && category !== 'All') where.category = category;
    // Default to Restaurant items; pass serviceCategory=all to get everything
    if (serviceCategory === 'all') {
      // no filter — return all service menus
    } else if (serviceCategory) {
      where.serviceCategory = serviceCategory;
    } else {
      where.serviceCategory = 'Restaurant';
    }

    const items = await MenuItem.findAll({
      where,
      order: [['serviceCategory', 'ASC'], ['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    // Group by category
    const grouped = {};
    for (const item of items) {
      const key = item.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    res.json({ items, grouped, categories: Object.keys(grouped) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/menu/all  (staff) ────────────────────────────────────────────────
exports.getAllMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.findAll({
      order: [['category', 'ASC'], ['sortOrder', 'ASC'], ['name', 'ASC']],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── GET /api/menu/categories  (public) ───────────────────────────────────────
exports.getCategories = async (req, res) => {
  res.json(MENU_CATEGORIES);
};

// ── POST /api/menu  (admin/manager) ──────────────────────────────────────────
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, available, sortOrder } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    let imageUrl = null;
    if (req.file?.path) {
      imageUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary
    }

    const item = await MenuItem.create({
      name: name.trim(),
      description: description?.trim() || null,
      image: imageUrl,
      price: parseFloat(price),
      category: category || 'Main Course',
      serviceCategory: req.body.serviceCategory || 'Restaurant',
      available: available !== 'false' && available !== false,
      sortOrder: parseInt(sortOrder) || 0,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── PUT /api/menu/:id  (admin/manager) ───────────────────────────────────────
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    const { name, description, price, category, available, sortOrder } = req.body;

    let imageUrl = item.image;
    if (req.file?.path) {
      // Delete old Cloudinary image if it exists
      if (item.image && item.image.includes('cloudinary')) {
        try {
          const publicId = item.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`hotel-menu/${publicId}`);
        } catch (_) {}
      }
      imageUrl = req.file.path;
    }

    await item.update({
      name: name ? name.trim() : item.name,
      description: description !== undefined ? description.trim() : item.description,
      image: imageUrl,
      price: price !== undefined ? parseFloat(price) : item.price,
      category: category || item.category,
      available: available !== undefined ? (available !== 'false' && available !== false) : item.available,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : item.sortOrder,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ── DELETE /api/menu/:id  (admin) ─────────────────────────────────────────────
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    // Delete from Cloudinary
    if (item.image && item.image.includes('cloudinary')) {
      try {
        const publicId = item.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`hotel-menu/${publicId}`);
      } catch (_) {}
    }

    await item.destroy();
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
