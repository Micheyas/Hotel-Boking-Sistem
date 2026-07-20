import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useCurrency, convertPrice } from '../CurrencyContext';
import { FAQAndLocation, FooterBar } from './Footer';
import '../styles/Services.css';

const CATEGORY_ICONS = {
  'Food & Beverage': '🍽️',
  'Wellness & Spa':  '💆',
  'Fitness':         '🏋️',
  'Transport':       '🚐',
  'Facilities':      '🏢',
  'Recreation':      '🎠',
  'Other':           '✨',
};

const Services = () => {
  const [services, setServices]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const { currency, rates }         = useCurrency();

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/categories'),
      ]);
      setServices(svcRes.data);
      setCategories(['All', ...catRes.data]);
    } catch (err) {
      setError('Unable to load hotel services. Please try again later.');
      console.error('Services fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const displayed = activeCategory === 'All'
    ? services
    : services.filter(s => s.category === activeCategory);

  // Group by category for the "All" view
  const grouped = displayed.reduce((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const formatHours = (from, to) => {
    if (!from && !to) return null;
    if (from === '00:00' && to === '23:59') return '24 hours';
    return `${from || '—'} – ${to || '—'}`;
  };

  const formatPrice = (service) => {
    if (service.priceLabel) return service.priceLabel;
    if (service.price == null) return 'Complimentary';
    return convertPrice(Number(service.price), currency, rates);
  };

  if (loading) {
    return (
      <div className="svc-loading">
        <div className="svc-spinner" />
        <p>Loading hotel services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="svc-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchServices}>Retry</button>
      </div>
    );
  }

  return (
    <div className="svc-page">

      {/* Hero banner */}
      <div className="svc-hero">
        <div className="svc-hero-overlay">
          <h1 className="svc-hero-title">Hotel Services</h1>
          <p className="svc-hero-sub">
            Everything you need for a perfect stay — dining, wellness, fitness, and more.
          </p>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="svc-tabs-wrap">
        <div className="svc-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`svc-tab ${activeCategory === cat ? 'svc-tab--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== 'All' && (CATEGORY_ICONS[cat] || '✨')} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services content */}
      <div className="svc-content">
        {services.length === 0 ? (
          <div className="svc-empty">
            <span>🏨</span>
            <p>No services available at the moment. Please check back soon.</p>
          </div>
        ) : activeCategory === 'All' ? (
          // Grouped by category
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="svc-section">
              <div className="svc-section-header">
                <span className="svc-section-icon">{CATEGORY_ICONS[cat] || '✨'}</span>
                <h2 className="svc-section-title">{cat}</h2>
                <span className="svc-section-count">{items.length} service{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="svc-grid">
                {items.map(s => (
                  <ServiceCard key={s.id} service={s} formatHours={formatHours} formatPrice={formatPrice} />
                ))}
              </div>
            </section>
          ))
        ) : (
          // Single category flat grid
          <div className="svc-grid svc-grid--single">
            {displayed.map(s => (
              <ServiceCard key={s.id} service={s} formatHours={formatHours} formatPrice={formatPrice} />
            ))}
          </div>
        )}
      </div>

      <FAQAndLocation />
      <FooterBar />
    </div>
  );
};

const ServiceCard = ({ service: s, formatHours, formatPrice }) => {
  const hours = formatHours(s.availableFrom, s.availableTo);
  const price = formatPrice(s);
  const isFree = !s.price && !s.priceLabel;

  return (
    <div className={`svc-card ${s.status === 'inactive' ? 'svc-card--inactive' : ''}`}>
      <div className="svc-card-icon">{s.icon || '🏨'}</div>
      <div className="svc-card-body">
        <div className="svc-card-top">
          <h3 className="svc-card-name">{s.name}</h3>
          <span className={`svc-price-badge ${isFree ? 'svc-price-badge--free' : ''}`}>
            {price}
          </span>
        </div>

        {s.description && (
          <p className="svc-card-desc">{s.description}</p>
        )}

        <div className="svc-card-meta">
          {hours && (
            <span className="svc-meta-item">
              <span className="svc-meta-icon">🕐</span> {hours}
            </span>
          )}
          {s.location && (
            <span className="svc-meta-item">
              <span className="svc-meta-icon">📍</span> {s.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
