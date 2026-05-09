const Offer = require('../models/Offer');

// Get all active offers
exports.getActiveOffers = async (req, res) => {
  try {
    const today = new Date();
    const offers = await Offer.findAll({
      where: {
        status: 'active',
        startDate: { [require('sequelize').Op.lte]: today },
        endDate: { [require('sequelize').Op.gte]: today },
      },
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create offer (admin only)
exports.createOffer = async (req, res) => {
  try {
    const { name, description, promoCode, discountType, discountValue, minNights, startDate, endDate } = req.body;
    const createdBy = req.user.id;

    const offer = await Offer.create({
      name,
      description,
      promoCode,
      discountType,
      discountValue,
      minNights,
      startDate,
      endDate,
      status: 'active',
      createdBy,
    });

    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all offers
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.findAll();
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate discount
exports.calculateDiscount = async (req, res) => {
  try {
    const { offerId, price, nights } = req.body;
    const offer = await Offer.findByPk(offerId);

    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    if (nights < offer.minNights) {
      return res.json({ discountAmount: 0, finalPrice: price, message: 'Minimum nights not met' });
    }

    let discountAmount = 0;
    if (offer.discountType === 'percentage') {
      discountAmount = (price * offer.discountValue) / 100;
    } else {
      discountAmount = offer.discountValue;
    }

    const finalPrice = price - discountAmount;
    res.json({ originalPrice: price, discountAmount, finalPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update offer status
exports.updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const offer = await Offer.findByPk(offerId);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    await offer.update({ status });
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};