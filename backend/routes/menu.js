const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { v2: cloudinary } = require('cloudinary');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const menuStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hotel-menu',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'fill', quality: 'auto' }],
    public_id: (req, file) => 'menu-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
  },
});
const uploadMenu = multer({ storage: menuStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public routes
router.get('/', menuController.getPublicMenu);
router.get('/categories', menuController.getCategories);

// Staff routes
router.get('/all', authenticateToken, authorizeRole(['admin', 'manager', 'receptionist']), menuController.getAllMenuItems);

// Admin/Manager CRUD
router.post('/', authenticateToken, authorizeRole(['admin', 'manager']), uploadMenu.single('image'), menuController.createMenuItem);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'manager']), uploadMenu.single('image'), menuController.updateMenuItem);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), menuController.deleteMenuItem);

module.exports = router;
