const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const { roomId, rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.create({ userId, roomId, rating, comment });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { roomId } = req.query;
    const where = {};
    if (roomId) where.roomId = roomId;

    const reviews = await Review.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};