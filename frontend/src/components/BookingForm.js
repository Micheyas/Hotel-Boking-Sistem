import React, { useState, useEffect } from 'react';
import api from '../api';

const BookingForm = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/rooms/types');
      setRoomTypes(response.data);
    } catch (err) {
      setError('Failed to fetch room types. Please ensure the backend server is running on port 5000.');
      console.error('Error fetching room types:', err);
    }
  };

  const calculatePrice = () => {
    if (!checkInDate || !checkOutDate || !roomTypeId) return;
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    const days = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const roomType = roomTypes.find(rt => rt.id === parseInt(roomTypeId));
    if (roomType) {
      setPrice(roomType.basePrice * days);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, [checkInDate, checkOutDate, roomTypeId]);

  const handleBook = async (e) => {
    e.preventDefault();
    
    // Validate guest info
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      setError('Please fill in your name, email, and phone');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings/guest', {
        roomTypeId,
        checkInDate,
        checkOutDate,
        totalPrice: price,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
      });
      setSuccess('Booking created successfully! We will send you a confirmation email shortly.');
      setCheckInDate('');
      setCheckOutDate('');
      setRoomTypeId('');
      setPrice(0);
      setGuestInfo({ name: '', email: '', phone: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <h2>Book a Room</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleBook}>
        <div>
          <label>Room Type:</label>
          <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} required>
            <option value="">Select a room type</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.name} - {rt.basePrice} ETB/night</option>
            ))}
          </select>
        </div>
        <div>
          <label>Check-in Date:</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Check-out Date:</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Your Name:</label>
          <input
            type="text"
            value={guestInfo.name}
            onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
            required
          />
        </div>
        <div>
          <label>Your Email:</label>
          <input
            type="email"
            value={guestInfo.email}
            onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
            required
          />
        </div>
        <div>
          <label>Phone:</label>
          <input
            type="tel"
            value={guestInfo.phone}
            onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
            required
          />
        </div>
        <div>
          <label>Currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="ETB">ETB (Ethiopian Birr)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="GBP">GBP (British Pound)</option>
            <option value="EUR">EUR (Euro)</option>
          </select>
        </div>
        <div>
          <p>Total Price: {price} {currency}</p>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Booking...' : 'Book Now'}</button>
      </form>
    </div>
  );
};

export default BookingForm;