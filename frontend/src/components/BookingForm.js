import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import RoomSlideshow from './RoomSlideshow';
import { useCurrency, convertPrice as ctxConvert, SYMBOLS } from '../CurrencyContext';

function convertPrice(etb, currency, rates) {
  return ctxConvert(etb, currency, rates);
}

// Fallback images by room type keyword — real hotel photos from Unsplash
const FALLBACK_IMAGES = {
  standard:  'https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=700&q=80',
  deluxe:    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&q=80',
  suite:     'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80',
  executive: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&q=80',
  penthouse: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&q=80',
  twin:      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=700&q=80',
  family:    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&q=80',
  default:   'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=700&q=80',
};

// Default amenities by room type keyword
const DEFAULT_AMENITIES = {
  standard:  ['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Work Desk'],
  deluxe:    ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini-bar', 'City View'],
  suite:     ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini-bar', 'Jacuzzi', 'Private Balcony'],
  executive: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini-bar', 'Lounge Access', 'Butler Service'],
  penthouse: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Premium Mini-bar', 'Jacuzzi', 'Private Balcony', 'Butler Service'],
  twin:      ['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Work Desk', 'Safe Box'],
  family:    ['Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Room Service', 'Safe Box'],
  default:   ['Free WiFi', 'Air Conditioning', 'Flat-screen TV'],
};

function getFallbackImage(name = '') {
  const n = name.toLowerCase();
  for (const key of Object.keys(FALLBACK_IMAGES)) {
    if (key !== 'default' && n.includes(key)) return FALLBACK_IMAGES[key];
  }
  return FALLBACK_IMAGES.default;
}

function getDefaultAmenities(name = '') {
  const n = name.toLowerCase();
  for (const key of Object.keys(DEFAULT_AMENITIES)) {
    if (key !== 'default' && n.includes(key)) return DEFAULT_AMENITIES[key];
  }
  return DEFAULT_AMENITIES.default;
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
  const [selected,  setSelected]  = useState(null);
  const { currency, rates } = useCurrency();
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [booking,   setBooking]   = useState(false);
  const [bookErr,   setBookErr]   = useState('');

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
      const res = await api.post('/bookings/guest', {
        roomId:      selected.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalPrice:  selected.totalPrice,
        guestName:   guestInfo.name,
        guestEmail:  guestInfo.email,
        guestPhone:  guestInfo.phone,
      });
      // Redirect to payment page with bookingId and amount
      const bookingId = res.data?.booking?.id || res.data?.id;
      navigate(`/payment?bookingId=${bookingId}&amount=${selected.totalPrice}`);
    } catch (err) {
      setBookErr(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

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
            <strong>{convertPrice(selected.totalPrice, currency, rates)}</strong>
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
            {booking ? 'Processing...' : '💳 Proceed to Payment'}
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
            {results.available.map((rt) => {
              const imageUrl = rt.image
                ? `http://localhost:5000${rt.image}`
                : getFallbackImage(rt.name);

              let amenityList = [];
              if (rt.amenities) {
                try {
                  const parsed = typeof rt.amenities === 'string' ? JSON.parse(rt.amenities) : rt.amenities;
                  amenityList = Array.isArray(parsed) ? parsed : [];
                } catch { amenityList = []; }
              }
              // If no amenities on the room, use smart defaults based on room type name
              if (amenityList.length === 0) {
                amenityList = getDefaultAmenities(rt.name);
              }

              return (
                <div key={rt.id} className="result-card">
                  <div className="result-image">
                    <RoomSlideshow
                      images={rt.images || []}
                      image={rt.image}
                      roomIndex={rt.id}
                      alt={rt.name}
                    />
                    <div className="result-price-badge">
                      {convertPrice(rt.basePrice, currency, rates)}<span>/night</span>
                    </div>
                  </div>
                  <div className="result-info">
                    <h4>{rt.name}</h4>
                    <p className="result-desc">{rt.description}</p>
                    <p className="result-floor">📍 Floor {rt.floor}</p>
                    {amenityList.length > 0 && (
                      <div className="result-amenities">
                        {amenityList.slice(0, 4).map((a, i) => (
                          <span key={i} className="amenity-tag">{a}</span>
                        ))}
                        {amenityList.length > 4 && (
                          <span className="amenity-tag">+{amenityList.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="result-footer">
                    <div className="result-total">
                      Total: <strong>{convertPrice(rt.totalPrice, currency, rates)}</strong>
                      <span className="result-nights"> · {rt.nights} night{rt.nights > 1 ? 's' : ''}</span>
                    </div>
                    <button className="result-select-btn" onClick={() => setSelected(rt)}>
                      Select Room
                    </button>
                  </div>
                </div>
              );
            })}
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
