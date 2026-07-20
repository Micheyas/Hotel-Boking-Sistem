const axios = require('axios');
const https = require('https');

// Bypass SSL verification (same as server.js global setting)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

let cachedRates = null;
let cacheTime   = 0;
let isLiveRate  = false;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES = { ETB: 1, USD: 0.00625, GBP: 0.00468, EUR: 0.00537 };

async function fetchLiveRates() {
  const apiKey = process.env.EXCHANGE_API_KEY;

  // If no API key is provided, silently use fallback
  if (!apiKey || apiKey === 'your_api_key') {
    return FALLBACK_RATES;
  }

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

  console.log('[Currency] Live rates fetched successfully');
  return rates;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Called from server.js on startup to pre-warm the cache.
// Retries up to 3 times with a 3-second delay between attempts.
// Falls back to FALLBACK_RATES if all attempts fail.
exports.warmCache = async () => {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY  = 3000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rates = await fetchLiveRates();
      // fetchLiveRates returns FALLBACK_RATES when no API key is configured —
      // treat that as a non-live result without consuming retry attempts.
      const apiKey = process.env.EXCHANGE_API_KEY;
      if (!apiKey || apiKey === 'your_api_key') {
        cachedRates = rates;
        cacheTime   = Date.now();
        isLiveRate  = false;
        console.log('[Currency] No API key configured — using fallback rates');
        return;
      }
      cachedRates = rates;
      cacheTime   = Date.now();
      isLiveRate  = true;
      return;
    } catch (err) {
      console.warn(`[Currency] warmCache attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All attempts exhausted — use fallback rates
  console.warn('[Currency] All warmCache attempts failed — using fallback rates');
  cachedRates = FALLBACK_RATES;
  cacheTime   = Date.now();
  isLiveRate  = false;
};

// GET /api/currency/rates
exports.getExchangeRates = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedRates && (now - cacheTime) < CACHE_TTL) {
      return res.json({
        rates: cachedRates,
        cached: true,
        isLive: isLiveRate,
        nextRefresh: new Date(cacheTime + CACHE_TTL),
      });
    }
    try {
      cachedRates = await fetchLiveRates();
      isLiveRate  = true;
    } catch (err) {
      console.warn('[Currency] Rate refresh failed, using fallback rates:', err.message);
      cachedRates = FALLBACK_RATES;
      isLiveRate  = false;
    }
    cacheTime = now;
    res.json({
      rates: cachedRates,
      cached: false,
      isLive: isLiveRate,
      nextRefresh: new Date(cacheTime + CACHE_TTL),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/currency/update  (manual refresh — admin use)
exports.updateExchangeRates = async (req, res) => {
  try {
    try {
      cachedRates = await fetchLiveRates();
      isLiveRate  = true;
    } catch (err) {
      console.warn('[Currency] Manual refresh failed, using fallback rates:', err.message);
      cachedRates = FALLBACK_RATES;
      isLiveRate  = false;
    }
    cacheTime = Date.now();
    res.json({ message: 'Exchange rates refreshed', rates: cachedRates, isLive: isLiveRate });
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
      try {
        cachedRates = await fetchLiveRates();
        isLiveRate  = true;
      } catch (err) {
        console.warn('[Currency] Convert fetch failed, using fallback rates:', err.message);
        cachedRates = FALLBACK_RATES;
        isLiveRate  = false;
      }
      cacheTime = Date.now();
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
