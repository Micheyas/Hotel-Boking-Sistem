import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const Rooms = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/rooms/types');
      setRoomTypes(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load rooms. Please try again.');
      setLoading(false);
      console.error('Error fetching rooms:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  if (loading) {
    return (
      <div className="rooms-container">
        <div className="loading">Loading rooms...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rooms-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h2>Our Rooms</h2>
        <p>Choose from our selection of luxurious accommodations</p>
      </div>

      <div className="rooms-grid">
        {roomTypes.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-image">
              <img 
                src={room.imageUrl || "https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=600&q=80"} 
                alt={room.name}
              />
              <div className="room-price">
                <span className="price">{formatPrice(room.basePrice)}</span>
                <span className="per-night"> ETB/night</span>
              </div>
            </div>
            <div className="room-details">
              <h3>{room.name}</h3>
              <p className="room-description">{room.description}</p>
              <div className="room-amenities">
                {room.amenities && room.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
              </div>
              <Link to="/booking" className="book-room-btn">Book Now</Link>
            </div>
          </div>
        ))}
      </div>

      {roomTypes.length === 0 && (
        <div className="no-rooms">
          <p>No rooms available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Rooms;
