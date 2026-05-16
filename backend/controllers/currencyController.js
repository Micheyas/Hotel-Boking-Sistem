const axios = require('axios');
const https = require('https');

// Bypass SSL verification (same as server.js global setting)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let cachedRates = null;
let cacheTime   = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES = { ETB: 1, USD: 0.0088, GBP: 0.0070, EUR: 0.0082 };

async function fetchLiveRates() {
  const apiKey = process.env.EXCHANGE_API_KEY;

  if (!apiKey || apiKey === 'your_api_key') {
    console.log('[Currency] No API key — using fallback rates');
    return FALLBACK_RATES;
  }

  try {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/ETB`;
    const res  = await axios.get(url, { timeout: 8000, httpsAgent });

    if (res.data?.result !== 'success') {
      throw new Error(res.data?.['error-type'] || 'API error');
    }

    const r = res.data.conversion_rates;
    const rates = {
      ETB: 1,
      USD: r.USD || FALLBACK_RATES.USD,
      GBP: r.GBP || FALLBACK_RATES.GBP,
      EUR: r.EUR || FALLBACK_RATES.EUR,
    };

    console.log('[Currency] Live rates fetched:', rates);
    return rates;
  } catch (err) {
    console.warn('[Currency] API fetch failed, using fallback:', err.message);
    return FALLBACK_RATES;
  }
}

// Called from server.js on startup to pre-warm the cache
exports.warmCache = async () => {
  cachedRates = await fetchLiveRates();
  cacheTime   = Date.now();
};

// GET /api/currency/rates
exports.getExchangeRates = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedRates && (now - cacheTime) < CACHE_TTL) {
      return res.json({ rates: cachedRates, cached: true, nextRefresh: new Date(cacheTime + CACHE_TTL) });
    }
    cachedRates = await fetchLiveRates();
    cacheTime   = now;
    res.json({ rates: cachedRates, cached: false, nextRefresh: new Date(cacheTime + CACHE_TTL) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/currency/update  (manual refresh — admin use)
exports.updateExchangeRates = async (req, res) => {
  try {
    cachedRates = await fetchLiveRates();
    cacheTime   = Date.now();
    res.json({ message: 'Exchange rates refreshed', rates: cachedRates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/currency/convert
exports.convertPrice = async (req, res) => {
  try {
    const { price, fromCurrency = 'ETB', toCurrency = 'ETB' } = req.body;
    if (fromCurrency === toCurrency) {
      return res.json({ convertedPrice: price, toCurrency });
    }
    if (!cachedRates) {
      cachedRates = await fetchLiveRates();
      cacheTime   = Date.now();
    }
    const fromRate  = cachedRates[fromCurrency] || 1;
    const toRate    = cachedRates[toCurrency]   || 1;
    const etbPrice  = fromCurrency === 'ETB' ? price : price / fromRate;
    const converted = toCurrency  === 'ETB' ? etbPrice : etbPrice * toRate;
    res.json({ originalPrice: price, fromCurrency, convertedPrice: Math.round(converted), toCurrency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
