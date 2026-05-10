import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const RATES   = { USD: 0.0088, GBP: 0.0070, EUR: 0.0082, ETB: 1 };
const SYMBOLS = { USD: '$', GBP: '£', EUR: '€', ETB: 'ETB ' };

function convertPrice(etb, currency) {
  const val = (etb * RATES[currency]).toFixed(0);
  return `${SYMBOLS[currency]}${Number(val).toLocaleString()}`;
}

const BookingForm = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const params    = new URLSearchParams(location.search);

  // Step 1 — search params
  const [checkIn,   setCheckIn]   = useState(params.get('checkIn')   || '');
  const [checkOut,  setCheckOut]  = useState(params.get('checkOut')  || '');
  const [adults,    setAdults]    = useState(Number(params.get('adults'))   || 1);
  const [children,  setChildren]  = useState(Number(params.get('children')) || 0);

  // Step 2 — availability results
  const [results,   setResults]   = useState(null);   // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');

  // Step 3 — booking
  const [selected,  setSelected]  = useState(null);   // chosen room type object
  const [currency,  setCurrency]  = useState('ETB');
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [booking,   setBooking]   = useState(false);
  const [bookErr,   setBookErr]   = useState('');
  const [success,   setSuccess]   = useState('');

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Auto-search if dates came from URL
  useEffect(() => {
    if (params.get('checkIn') && params.get('checkOut')) {
      doSearch(params.get('checkIn'), params.get('checkOut'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (ci, co) => {
    setSearchErr('');
    setResults(null);
    setSelected(null);
    if (!ci || !co) { setSearchErr('Please select both dates.'); return; }
    if (new Date(co) <= new Date(ci)) { setSearchErr('Check-out must be after check-in.'); return; }

    setSearching(true);
    try {
      const res = await api.get(
        `/rooms/check-availability?checkIn=${ci}&checkOut=${co}&adults=${adults}&children=${children}`
      );
      setResults(res.data);
    } catch (err) {
      setSearchErr(err.response?.data?.error || 'Failed to check availability.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCheckIn(checkIn);
    setCheckOut(checkOut);
    doSearch(checkIn, checkOut);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      setBookErr('Please fill in your name, email, and phone.');
      return;
    }
    setBooking(true);
    setBookErr('');
    try {
      await api.post('/bookings/guest', {
        roomId:  selected.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice:  selected.totalPrice,
        guestName:   guestInfo.name,
        guestEmail:  guestInfo.email,
        guestPhone:  guestInfo.phone,
      });
      setSuccess('Booking confirmed! Check your email for details.');
    } catch (err) {
      setBookErr(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="booking-form">
        <div className="booking-success">
          <span className="success-icon">🎉</span>
          <h2>Booking Received!</h2>
          <p>{success}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // ── Step 3: Guest details ──
  if (selected) {
    const nights = results?.nights || 1;
    return (
      <div className="booking-form">
        <button className="back-btn" onClick={() => setSelected(null)}>← Back to results</button>
        <h2>Complete Your Booking</h2>

        <div className="selected-room-summary">
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
          <div className="summary-row">
            <span>📅 {checkIn} → {checkOut} ({nights} night{nights > 1 ? 's' : ''})</span>
          </div>
          <div className="summary-row">
            <span>👤 {adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}</span>
          </div>
          <div className="summary-price">
            <span>Total: </span>
            <strong>{convertPrice(selected.totalPrice, currency)}</strong>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="currency-inline"
            >
              {['ETB','USD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {bookErr && <p className="error">{bookErr}</p>}

        <form onSubmit={handleBook} className="guest-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={guestInfo.name}
              onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={guestInfo.email}
              onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              placeholder="+251 9xx xxx xxx"
              value={guestInfo.phone}
              onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={booking} className="btn btn-primary book-confirm-btn">
            {booking ? 'Confirming...' : '✅ Confirm Booking'}
          </button>
        </form>
      </div>
    );
  }

  // ── Step 1 + 2: Search & Results ──
  return (
    <div className="booking-form">
      <h2>🔍 Check Availability</h2>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="availability-search inline">
        <div className="search-fields">
          <div className="search-field">
            <label>📅 Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div className="search-field">
            <label>📅 Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || tomorrow}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div className="search-field search-field-sm">
            <label>👤 Adults</label>
            <input type="number" min="1" max="6" value={adults}
              onChange={(e) => setAdults(Number(e.target.value))} />
          </div>
          <div className="search-field search-field-sm">
            <label>🧒 Children</label>
            <input type="number" min="0" max="4" value={children}
              onChange={(e) => setChildren(Number(e.target.value))} />
          </div>
          <button type="submit" className="search-btn" disabled={searching}>
            {searching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
        {searchErr && <p className="search-error">{searchErr}</p>}
      </form>

      {/* Results */}
      {results && (
        <div className="availability-results">
          <h3>
            {results.available.length > 0
              ? `${results.available.length} room${results.available.length > 1 ? 's' : ''} available`
              : 'No rooms available for these dates'}
          </h3>
          <p className="results-meta">
            {results.checkIn} → {results.checkOut} · {results.nights} night{results.nights > 1 ? 's' : ''} ·
            {' '}{adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}
          </p>

          <div className="results-grid">
            {results.available.map((rt) => (
              <div key={rt.id} className="result-card">
                {rt.image && (
                  <div className="result-image">
                    <img src={`http://localhost:5000${rt.image}`} alt={rt.name} />
                  </div>
                )}
                <div className="result-info">
                  <h4>{rt.name}</h4>
                  <p>{rt.description}</p>
                  <p className="result-count">📍 Floor {rt.floor}</p>
                  <div className="result-amenities">
                    {rt.amenities && (() => {
                      const list = typeof rt.amenities === 'string' ? JSON.parse(rt.amenities) : rt.amenities;
                      return Array.isArray(list)
                        ? list.slice(0, 4).map((a, i) => <span key={i} className="amenity-tag">{a}</span>)
                        : null;
                    })()}
                  </div>
                </div>
                <div className="result-price">
                  <p className="price-per-night">ETB {rt.basePrice.toLocaleString()}<span>/night</span></p>
                  <p className="price-total">Total: ETB {rt.totalPrice.toLocaleString()}</p>
                  <button className="btn btn-primary" onClick={() => setSelected(rt)}>
                    Select Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!results && !searching && (
        <p className="search-hint">Enter your dates above to see available rooms.</p>
      )}
    </div>
  );
};

export default BookingForm;
