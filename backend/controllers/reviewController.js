const { Review, User, Room, HotelService } = require('../models');
const { Booking } = require('../models');

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      reviewType = 'room',
      roomId,
      serviceId,
      rating,
      comment,
      cleanlinessRating,
      staffRating,
      locationRating,
      valueRating,
    } = req.body;

    // Validate reviewType
    if (!['room', 'service', 'hotel'].includes(reviewType)) {
      return res.status(400).json({ error: 'reviewType must be room, service, or hotel' });
    }

    // Validate required IDs per type
    if (reviewType === 'room' && !roomId) {
      return res.status(400).json({ error: 'roomId is required for room reviews' });
    }
    if (reviewType === 'service' && !serviceId) {
      return res.status(400).json({ error: 'serviceId is required for service reviews' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    // ── Email verification + booking check (for room reviews) ──────
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Your email address is not verified. Please verify your email before submitting a review.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // For room reviews, require a booking history for that specific room
    if (reviewType === 'room') {
      const { Op } = require('sequelize');
      const userBookings = await Booking.findAll({
        where: {
          roomId: parseInt(roomId),
          status: { [Op.notIn]: ['cancelled'] },
          [Op.or]: [
            { userId: user.id },
            { guestEmail: user.email.toLowerCase() },
          ],
        },
      });

      if (userBookings.length === 0) {
        return res.status(403).json({
          error: 'You can only review rooms you have actually booked. No booking found for this room.',
          code: 'NO_BOOKING_FOUND',
        });
      }
    }
    // ─────────────────────────────────────────────────────────────

    const review = await Review.create({
      userId,
      reviewType,
      roomId: reviewType === 'room' ? parseInt(roomId) : null,
      serviceId: reviewType === 'service' ? parseInt(serviceId) : null,
      rating: parseInt(rating),
      comment: comment || null,
      cleanlinessRating: cleanlinessRating ? parseInt(cleanlinessRating) : null,
      staffRating: staffRating ? parseInt(staffRating) : null,
      locationRating: locationRating ? parseInt(locationRating) : null,
      valueRating: valueRating ? parseInt(valueRating) : null,
    });

    // Return with user info
    const full = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });

    res.status(201).json(full);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/reviews?reviewType=room&roomId=1&serviceId=2
exports.getReviews = async (req, res) => {
  try {
    const { reviewType, roomId, serviceId } = req.query;
    const where = {};

    if (reviewType) where.reviewType = reviewType;
    if (roomId) where.roomId = parseInt(roomId);
    if (serviceId) where.serviceId = parseInt(serviceId);

    const reviews = await Review.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reviews/summary — public hotel-wide stats
exports.getHotelSummary = async (req, res) => {
  try {
    const allReviews = await Review.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    const avg = (arr) =>
      arr.length ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : null;

    const byType = { room: [], service: [], hotel: [] };
    for (const r of allReviews) {
      if (byType[r.reviewType]) byType[r.reviewType].push(r);
    }

    const summarize = (list) => ({
      count: list.length,
      averageRating: avg(list.map((r) => r.rating)),
      distribution: [5, 4, 3, 2, 1].reduce((acc, star) => {
        acc[star] = list.filter((r) => r.rating === star).length;
        return acc;
      }, {}),
      recent: list.slice(0, 5),
    });

    // Hotel sub-category averages (from hotel-type reviews)
    const hotelReviews = byType.hotel;
    const hotelSubRatings = {
      cleanliness: avg(hotelReviews.filter((r) => r.cleanlinessRating).map((r) => r.cleanlinessRating)),
      staff: avg(hotelReviews.filter((r) => r.staffRating).map((r) => r.staffRating)),
      location: avg(hotelReviews.filter((r) => r.locationRating).map((r) => r.locationRating)),
      value: avg(hotelReviews.filter((r) => r.valueRating).map((r) => r.valueRating)),
    };

    const overallRatings = allReviews.map((r) => r.rating);
    const overallAvg = avg(overallRatings);

    res.json({
      overall: {
        count: allReviews.length,
        averageRating: overallAvg,
        distribution: [5, 4, 3, 2, 1].reduce((acc, star) => {
          acc[star] = allReviews.filter((r) => r.rating === star).length;
          return acc;
        }, {}),
      },
      room: summarize(byType.room),
      service: summarize(byType.service),
      hotel: { ...summarize(byType.hotel), subRatings: hotelSubRatings },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reviews/all — admin/manager view of all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Room, as: 'room', attributes: ['id', 'roomNumber'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/reviews/:id — admin/manager only
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    await review.destroy();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
