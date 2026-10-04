const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Cloudinary storage — files go directly to cloud, never deleted
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hotel-payments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Authenticated delivery: the raw Cloudinary URL returns 401 without a
    // signed URL. Staff view proofs via GET /api/staff/documents/signed-url.
    type: 'authenticated',
    public_id: (req, file) => 'payment-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadPayment = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = uploadPayment;
