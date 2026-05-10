import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
// Staff login is accessed directly via URL for security
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import PaymentForm from './components/PaymentForm';
import ReviewForm from './components/ReviewForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Rooms from './components/Rooms';
import Amenities from './components/Amenities';
import FAQ from './components/FAQ';

const CURRENCIES = ['ETB', 'USD', 'GBP', 'EUR'];

const RATES = { USD: 0.0088, GBP: 0.0070, EUR: 0.0082, ETB: 1 };

function convertPrice(priceETB, currency) {
  if (currency === 'ETB') return `ETB ${priceETB.toLocaleString()}`;
  const converted = (priceETB * RATES[currency]).toFixed(0);
  const symbols = { USD: '$', GBP: '£', EUR: '€' };
  return `${symbols[currency]}${Number(converted).toLocaleString()}`;
}

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
    localStorage.setItem('currency', e.target.value);
  };

  useEffect(() => {
    if (token) {
      const socket = io('http://localhost:5000', { auth: { token } });
      socket.on('roomStatusChanged', (data) => {
        console.log('Room status updated:', data);
      });
      return () => socket.disconnect();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-top">
            <div className="header-brand">
              <span className="header-icon"></span>
              <div>
                <h1>The William Vale Hotel</h1>
                <p className="header-subtitle">Williamsburg, Brooklyn · NYC Skyline Views</p>
              </div>
            </div>
            <div className="header-controls">
              {/* Currency Selector */}
              <div className="currency-selector">
                <span className="currency-label">🌍 Currency</span>
                <select value={currency} onChange={handleCurrencyChange} className="currency-select">
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/rooms">Rooms</Link>
            <Link to="/amenities">Amenities</Link>
            <a href="#faq">FAQ</a>
            <Link to="/booking" className="nav-book-btn">Book Now</Link>
            <Link to="/dashboard">My Bookings</Link>
            <Link to="/admin" className="staff-portal-link">🔑 Staff Portal</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home currency={currency} />} />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/amenities" element={<Amenities />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/payment" element={<PaymentForm />} />
            <Route path="/reviews/:roomId" element={<ReviewForm roomId={new URLSearchParams(window.location.search).get('roomId')} />} />
          </Routes>
        </main>
        {/* Side-by-Side: Prime Location & FAQ */}
        <div className="side-by-side-container">
          {/* Prime Location Section */}
          <section className="prime-location-mini">
            <div className="location-content-mini">
              <h2>📍 Location</h2>
              <p className="location-address-mini">111 N 12th St, Brooklyn, NY</p>
              <div className="location-map-mini">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.4!2d-73.956!3d40.721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2s111%20N%2012th%20St%2C%20Brooklyn%2C%20NY%2011249!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hotel Location"
                ></iframe>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="faq-mini" id="faq">
            <FAQ />
          </section>
        </div>

        <footer className="App-footer">
          <div className="footer-content">
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/rooms">Rooms</Link>
              <Link to="/amenities">Amenities</Link>
              <a href="#faq">FAQ</a>
              <Link to="/booking">Book Now</Link>
            </div>
            <p>© 2026 The William Vale Hotel · Williamsburg, Brooklyn, NYC · All rights reserved</p>
            {/* Staff access only - direct URL: /staff */}
          </div>
        </footer>
      </div>
    </Router>
  );
}

const featuredHotels = [
  {
    name: "The William Vale Hotel",
    location: "Williamsburg, Brooklyn, NYC",
    description: "Premier luxury hotel facing the iconic Manhattan skyline. Modern architecture with world-class amenities and stunning rooftop views.",
    rating: 5,
    priceETB: 19500,
    image: "https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=600&q=80",
    tag: "Featured"
  },
  {
    name: "Burj Al Arab",
    location: "Dubai, UAE",
    description: "The world's most iconic sail-shaped hotel standing on its own private island with butler service and unmatched opulence.",
    rating: 5,
    priceETB: 170000,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80",
    tag: "Ultra Luxury"
  },
  {
    name: "The Ritz Paris",
    location: "Paris, France",
    description: "Legendary palace hotel in the heart of Place Vendôme, offering timeless elegance and Michelin-starred dining since 1898.",
    rating: 5,
    priceETB: 136000,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    tag: "Historic"
  },
  {
    name: "Marina Bay Sands",
    location: "Singapore",
    description: "World-famous integrated resort with an iconic rooftop infinity pool overlooking the stunning Singapore skyline.",
    rating: 5,
    priceETB: 51000,
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80",
    tag: "Iconic"
  },
  {
    name: "The Plaza Hotel",
    location: "New York, USA",
    description: "A National Historic Landmark at the corner of Fifth Avenue, overlooking Central Park with legendary grandeur since 1907.",
    rating: 5,
    priceETB: 91000,
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80",
    tag: "Classic"
  },
  {
    name: "Aman Tokyo",
    location: "Tokyo, Japan",
    description: "Serene urban sanctuary on the top six floors of the Otemachi Tower, blending Japanese aesthetics with contemporary luxury.",
    rating: 5,
    priceETB: 102000,
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
    tag: "Zen Luxury"
  },
  {
    name: "Four Seasons Bali",
    location: "Sayan, Bali, Indonesia",
    description: "Breathtaking resort nestled among terraced rice paddies above the sacred Ayung River, offering private villas and infinity pools.",
    rating: 5,
    priceETB: 68000,
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    tag: "Paradise"
  },
  {
    name: "The Savoy",
    location: "London, UK",
    description: "London's most storied luxury hotel on the Strand, blending Edwardian and Art Deco grandeur with impeccable Thames River views.",
    rating: 5,
    priceETB: 79500,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    tag: "Royal"
  },
  {
    name: "Santorini Grace Hotel",
    location: "Santorini, Greece",
    description: "Clifftop boutique hotel carved into the volcanic caldera with private plunge pools and breathtaking Aegean sunset views.",
    rating: 5,
    priceETB: 62500,
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80",
    tag: "Scenic"
  },
];

function Home({ currency }) {
  const token = localStorage.getItem('token');
  return (
    <div className="home">
      {/* Gallery Slideshow Background */}
      <div className="gallery-slideshow-background">
        <div className="slideshow-container">
          {galleryImages.map((img, index) => (
            <div key={index} className="slide" style={{ animationDelay: `${index * 5}s` }}>
              <img src={img.url} alt={img.caption} className="slide-image" />
            </div>
          ))}
        </div>
        <div className="slideshow-overlay">
          <div className="hero-content">
            <h1 className="hero-title">The William Vale Hotel</h1>
            <p className="hero-subtitle">📍 Williamsburg, Brooklyn · Facing the NYC Skyline</p>
            <p className="hero-description">
              Experience luxury with stunning Manhattan views. Modern design meets world-class hospitality.
            </p>
            {!token ? (
              <div className="cta-buttons">
                <a href="/register" className="btn btn-primary">Book Your Stay</a>
                <a href="/login" className="btn btn-secondary">Sign In</a>
              </div>
            ) : (
              <div className="cta-buttons">
                <a href="/booking" className="btn btn-primary">Reserve Now</a>
                <a href="/dashboard" className="btn btn-secondary">My Bookings</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="highlights-section">
        <h3>Why Choose The William Vale</h3>
        <div className="highlights-grid">
          <div className="highlight-card">
            <span className="highlight-icon">🌆</span>
            <h4>Manhattan Skyline Views</h4>
            <p>Spectacular views of the iconic NYC skyline from Williamsburg</p>
          </div>
          <div className="highlight-card">
            <span className="highlight-icon">✨</span>
            <h4>Luxury Accommodations</h4>
            <p>Premium rooms with modern amenities and elegant design</p>
          </div>
          <div className="highlight-card">
            <span className="highlight-icon">🍽️</span>
            <h4>Fine Dining</h4>
            <p>Award-winning restaurants and bars with world-class cuisine</p>
          </div>
          <div className="highlight-card">
            <span className="highlight-icon">🏊</span>
            <h4>Spa & Wellness</h4>
            <p>Full-service spa, fitness center, and wellness facilities</p>
          </div>
        </div>
      </div>

      {/* Features Strip */}
      <div className="features-strip">
        <div className="feature-item"><span className="feature-icon">🌍</span><span>Multi-Currency Support</span></div>
        <div className="feature-item"><span className="feature-icon">⚡</span><span>Instant Confirmation</span></div>
        <div className="feature-item"><span className="feature-icon">🔒</span><span>Secure Payments</span></div>
        <div className="feature-item"><span className="feature-icon">🎁</span><span>Exclusive Offers</span></div>
      </div>

      {/* CTA Banner */}
      <div className="cta-banner">
        <h3>Ready for an Unforgettable Experience?</h3>
        <p>Join thousands of travelers who book with us every day</p>
        <a href={token ? '/booking' : '/register'} className="btn">
          {token ? 'Book Your Room' : 'Start for Free'}
        </a>
      </div>
    </div>
  );
}

const galleryImages = [
  { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80", caption: "Grand Lobby" },
  { url: "https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=600&q=80", caption: "Suite Bedroom" },
  { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80", caption: "Dining Area" },
  { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80", caption: "Spa & Wellness" },
  { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80", caption: "Rooftop Bar" },
];

export default App;
