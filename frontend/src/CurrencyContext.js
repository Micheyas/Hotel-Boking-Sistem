import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fallback rates used until live rates load
const FALLBACK_RATES = { ETB: 1, USD: 0.0088, GBP: 0.0070, EUR: 0.0082 };

export const SYMBOLS = { ETB: 'ETB ', USD: '$', GBP: '£', EUR: '€' };

export const CURRENCIES = [
  { code: 'ETB', label: 'ETB - Ethiopian Birr', flag: '🇪🇹' },
  { code: 'USD', label: 'USD - US Dollar',       flag: '🇺🇸' },
  { code: 'GBP', label: 'GBP - British Pound',   flag: '🇬🇧' },
  { code: 'EUR', label: 'EUR - Euro',             flag: '🇪🇺' },
];

export const CurrencyContext = createContext({
  currency: 'ETB',
  setCurrency: () => {},
  rates: FALLBACK_RATES,
  ratesLoading: false,
});

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(
    localStorage.getItem('currency') || 'ETB'
  );
  const [rates, setRates]           = useState(FALLBACK_RATES);
  const [ratesLoading, setLoading]  = useState(true);

  // Fetch live rates from backend on mount
  useEffect(() => {
    fetch(`${API_URL}/currency/rates`)
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          setRates({ ETB: 1, ...data.rates });
          console.log('[Currency] Live rates loaded:', data.rates);
        }
      })
      .catch(err => {
        console.warn('[Currency] Could not load live rates, using fallback:', err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const setCurrency = (code) => {
    setCurrencyState(code);
    localStorage.setItem('currency', code);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, ratesLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Hook
export const useCurrency = () => useContext(CurrencyContext);

// Convert ETB price to selected currency using live rates
export function convertPrice(etbPrice, currency, rates = FALLBACK_RATES) {
  const rate   = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  const symbol = SYMBOLS[currency] ?? 'ETB ';
  const converted = Math.round(etbPrice * rate);
  return `${symbol}${converted.toLocaleString()}`;
}
