const ExchangeRate = require('../models/ExchangeRate');
const axios = require('axios');

// Get exchange rates
exports.getExchangeRates = async (req, res) => {
  try {
    const rates = await ExchangeRate.findAll({
      where: { baseCurrency: 'ETB' },
    });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch and update rates from API
exports.updateExchangeRates = async (req, res) => {
  try {
    // Using a mock update since we don't have actual API configured
    const currencies = ['USD', 'GBP', 'EUR'];
    const mockRates = {
      USD: 0.0088,
      GBP: 0.0070,
      EUR: 0.0082,
    };

    for (const currency of currencies) {
      await ExchangeRate.upsert({
        baseCurrency: 'ETB',
        targetCurrency: currency,
        rate: mockRates[currency],
        lastUpdated: new Date(),
      });
    }

    res.json({ message: 'Exchange rates updated', rates: mockRates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Convert price
exports.convertPrice = async (req, res) => {
  try {
    const { price, fromCurrency, toCurrency } = req.body;

    if (fromCurrency === toCurrency) {
      return res.json({ originalPrice: price, convertedPrice: price, currency: toCurrency });
    }

    // If converting from non-ETB to non-ETB, convert via ETB
    let etbPrice = price;
    if (fromCurrency !== 'ETB') {
      const fromRate = await ExchangeRate.findOne({
        where: { baseCurrency: 'ETB', targetCurrency: fromCurrency },
      });
      if (!fromRate) return res.status(404).json({ error: `Rate for ${fromCurrency} not found` });
      etbPrice = price / fromRate.rate;
    }

    // Convert from ETB to target currency
    const toRate = await ExchangeRate.findOne({
      where: { baseCurrency: 'ETB', targetCurrency: toCurrency },
    });
    if (!toRate && toCurrency !== 'ETB') {
      return res.status(404).json({ error: `Rate for ${toCurrency} not found` });
    }

    const convertedPrice = toCurrency === 'ETB' ? etbPrice : etbPrice * toRate.rate;
    res.json({ originalPrice: price, fromCurrency, convertedPrice, toCurrency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};