import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import AvailabilitySearch from './AvailabilitySearch';

const STATUS_LABEL = {
  available:   { text: 'Available',   color: '#2e7d32', bg: '#e8f5e9' },
  occupied:    { text: 'Occupied',    color: '#b71c1c', bg: '#ffebee' },
  maintenance: { text: 'Maintenance', color: '#e65100', bg: '#fff3e0' },
};

const Rooms = () => {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('all'); // all | available | occupied | maintenance

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Public endpoint — returns all rooms with their type info
      const response = await api.get('/rooms/public');
      setRooms(response.data);
    } catch (err) {
      setError('Failed to load rooms. Please try again.');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US').format(price);

  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    try {
      const parsed = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()) : [];
    }
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  if (loading) return (
    <div className="rooms-container">
      <div className="loading">Loading rooms...</div>
    </div>
  );

  if (error) return (
    <div className="rooms-container">
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h2>Our Rooms</h2>
        <p>Browse all {rooms.length} rooms and check availability</p>
      </div>

      {/* Availability search */}
      <div className="rooms-search-bar">
        <AvailabilitySearch />
      </div>

      {/* Filter tabs */}
      <div className="rooms-filter-tabs">
        {['all', 'available', 'occupied', 'maintenance'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${rooms.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${rooms.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      <div className="rooms-grid">
        {filtered.map((room) => {
          const statusInfo = STATUS_LABEL[room.status] || STATUS_LABEL.available;
          const amenities  = parseAmenities(room.amenities);
          const price      = room.roomType?.basePrice;
          const typeName   = room.roomType?.name || 'Room';
          const image      = room.image
            ? `http://localhost:5000${room.image}`
            : 'https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=600&q=80';

          return (
            <div key={room.id} className="room-card">
              <div className="room-image">
                <img src={image} alt={`Room ${room.roomNumber}`} />
                {/* Price badge — top right */}
                {price && (
                  <div className="room-price-badge">
                    {formatPrice(price)} ETB/night
                  </div>
                )}
                {/* Status badge — top left, only if not available */}
                {room.status !== 'available' && (
                  <span
                    className="room-status-badge"
                    style={{ background: statusInfo.bg, color: statusInfo.color }}
                  >
                    {statusInfo.text}
                  </span>
                )}
              </div>

              <div className="room-details">
                <h3 className="room-type-name">{typeName}</h3>
                {room.roomType?.description && (
                  <p className="room-description">{room.roomType.description}</p>
                )}
                {amenities.length > 0 && (
                  <div className="room-amenities">
                    {amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="amenity-tag">{a}</span>
                    ))}
                    {amenities.length > 3 && (
                      <span className="amenity-tag">+{amenities.length - 3} more</span>
                    )}
                  </div>
                )}
                <div className="room-footer">
                  <span className="room-guests">
                    Up to {room.roomType?.capacity || 2} guests
                  </span>
                  {room.status === 'available' ? (
                    <Link to="/booking" className="book-room-btn">Book Now</Link>
                  ) : (
                    <button className="book-room-btn disabled" disabled>
                      {statusInfo.text}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="no-rooms">
          <p>No {filter !== 'all' ? filter : ''} rooms found.</p>
        </div>
      )}
    </div>
  );
};

export default Rooms;
