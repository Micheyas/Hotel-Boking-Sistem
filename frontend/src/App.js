import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import BookingForm from './components/BookingForm';
import AdminPanel from './components/AdminPanel';
import PaymentForm from './components/PaymentForm';
import ReviewForm from './components/ReviewForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Rooms from './components/Rooms';
import Amenities from './components/Amenities';
import FAQ from './components/FAQ';
import AvailabilitySearch from './components/AvailabilitySearch';
import RoomSlideshow from './components/RoomSlideshow';
import { FAQAndLocation, FooterBar } from './components/Footer';
import { CurrencyProvider, useCurrency, CURRENCIES, convertPrice } from './CurrencyContext';

function App() {
  return (
    <CurrencyProvider>
      <Router>
        <AppInner />
      </Router>
    </CurrencyProvider>
  );
}

function AppInner() {
  const { currency, setCurrency } = useCurrency();
  const activeCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <div className="App">
      {/* ── Slim Navbar ── */}
      <header className="navbar">
        <Link to="/" className="navbar-logo">2RN Solomon</Link>
        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/rooms">Rooms</Link>
          <Link to="/amenities">Amenities</Link>
          <Link to="/admin" className="navbar-staff">🔑 Staff</Link>
          <div className="navbar-currency">
            <span>{activeCurrency.flag}</span>
            <select
              value={activeCurrency.code}
              onChange={e => setCurrency(e.target.value)}
              className="navbar-currency-select"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <span>🌐</span>
          </div>
          <Link to="/booking" className="navbar-book-btn">Book Now</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/payment" element={<PaymentForm />} />
          <Route path="/reviews/:roomId" element={<ReviewForm roomId={new URLSearchParams(window.location.search).get('roomId')} />} />
        </Routes>
      </main>
    </div>
  );
}



function FeaturedRooms() {
  const [rooms, setRooms] = React.useState([]);
  const { currency, rates } = useCurrency();

  React.useEffect(() => {
    fetch('http://localhost:5000/api/rooms/public')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        // Group by room type — keep one representative room per type
        const seen = new Map();
        for (const room of data) {
          const typeId = room.roomTypeId;
          if (!seen.has(typeId)) {
            seen.set(typeId, room);
          } else {
            // Prefer rooms that have images uploaded
            const existing = seen.get(typeId);
            const existingHasImg = existing.image || (existing.images && existing.images !== '[]');
            const newHasImg = room.image || (room.images && room.images !== '[]');
            if (!existingHasImg && newHasImg) seen.set(typeId, room);
          }
        }
        setRooms([...seen.values()]);
      })
      .catch(() => {});
  }, []);

  if (rooms.length === 0) return null;

  const parseAmenities = (a) => {
    if (!a) return [];
    try { const p = typeof a === 'string' ? JSON.parse(a) : a; return Array.isArray(p) ? p : []; }
    catch { return []; }
  };

  return (
    <div className="featured-rooms-section">
      <div className="featured-rooms-header">
        <h2>Our Rooms</h2>
        <p>Handpicked accommodations for your perfect stay</p>
        <a href="/rooms" className="view-all-btn">View All Rooms →</a>
      </div>
      <div className="featured-rooms-grid">
        {rooms.map(room => {
          let imageList = [];
          try { imageList = JSON.parse(room.images || '[]'); } catch { imageList = []; }
          if (imageList.length === 0 && room.image) imageList = [room.image];
          const amenities = parseAmenities(room.amenities);
          const isAvailable = room.status === 'available';
          return (
            <div key={room.id} className="featured-room-card">
              <div className="featured-room-img">
                <RoomSlideshow
                  images={imageList}
                  image={room.image}
                  roomIndex={room.id}
                  alt={`Room ${room.roomNumber}`}
                  interval={5000}
                />
                <span className={`fr-status ${room.status}`}>
                  {isAvailable ? 'Available' : room.status}
                </span>
              </div>
              <div className="featured-room-info">
                <div className="fr-title-row">
                  <h3>{room.roomType?.name || 'Room'}</h3>
                  <span className="fr-type">Room {room.roomNumber}</span>
                </div>
                <p className="fr-desc">{room.roomType?.description || ''}</p>
                {amenities.length > 0 && (
                  <div className="fr-amenities">
                    {amenities.slice(0, 3).map((a, i) => <span key={i} className="amenity-tag">{a}</span>)}
                  </div>
                )}
                <div className="fr-footer">
                  <span className="fr-price">
                    {convertPrice(room.roomType?.basePrice || 0, currency, rates)}
                    <span>/night</span>
                  </span>
                  {isAvailable
                    ? <a href="/booking" className="fr-book-btn">Book Now</a>
                    : <span className="fr-unavailable">Unavailable</span>
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home({ activeCurrency, onCurrencyChange }) {
  return (
    <div className="home">
      {/* Hero */}
      <div className="hero">
        {/* Slideshow */}
        <div className="slideshow-container">
          {galleryImages.map((img, i) => (
            <div key={i} className="slide" style={{ animationDelay: `${i * 5}s` }}>
              <img src={img.url} alt={img.caption} className="slide-image" />
            </div>
          ))}
        </div>
        <div className="hero-overlay">

          {/* Hero text */}
          <div className="hero-text">
            <div className="hero-stars">⭐⭐⭐⭐⭐</div>
            <h1 className="hero-title">Welcome to 2RN Solomon</h1>
            <p className="hero-subtitle">Where Luxury Meets Tranquility</p>
          </div>

          {/* Availability search card */}
          <div className="hero-search-card">
            <AvailabilitySearch />
          </div>

        </div>
      </div>

      {/* Featured Rooms */}
      <FeaturedRooms />

      {/* What We Offer */}
      <div className="what-we-offer">
        <div className="wwo-header">
          <h2>What We Offer</h2>
          <p>Experience exceptional services and facilities designed for your comfort and enjoyment</p>
        </div>
        <div className="wwo-grid">
          <div className="wwo-card">
            <div className="wwo-img">
              <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80" alt="WiFi" />
              <span className="wwo-icon">📶</span>
            </div>
            <h4>Free High-Speed WiFi</h4>
            <p>Stay connected throughout the property</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" alt="Spa" />
              <span className="wwo-icon">🤍</span>
            </div>
            <h4>Luxury Spa</h4>
            <p>Rejuvenate with world-class treatments</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" alt="Gym" />
              <span className="wwo-icon">�️</span>
            </div>
            <h4>24/7 Gym</h4>
            <p>State-of-the-art equipment always open</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" alt="Sky Bar" />
              <span className="wwo-icon">�</span>
            </div>
            <h4>Sky Bar</h4>
            <p>Craft cocktails with stunning views</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" alt="Fine Dining" />
              <span className="wwo-icon">🍽️</span>
            </div>
            <h4>Fine Dining</h4>
            <p>Award-winning culinary experiences</p>
          </div>
        </div>
      </div>

      {/* Amenities Section — includes FAQ, Location, and Footer */}
      <Amenities />
    </div>
  );
}

const galleryImages = [
  { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=80", caption: "Grand Lobby" },
  { url: "https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=1400&q=80", caption: "Suite Bedroom" },
  { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=80", caption: "Dining Area" },
  { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=80", caption: "Spa & Wellness" },
  { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&q=80", caption: "Rooftop Bar" },
];

export default App;

