import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminPanel = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('bookings');
  
  // Room form state
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomTypeId: '',
    floor: '',
    status: 'available',
    image: null,
    amenities: []
  });
  
  // Common amenities with icons
  const commonAmenities = [
    { name: 'WiFi', icon: '📶' },
    { name: 'TV', icon: '📺' },
    { name: 'Air Conditioning', icon: '❄️' },
    { name: 'Mini Bar', icon: '🍷' },
    { name: 'Safe', icon: '🔒' },
    { name: 'Balcony', icon: '🌅' },
    { name: 'Coffee Maker', icon: '☕' },
    { name: 'Hair Dryer', icon: '💨' },
    { name: 'Iron & Ironing Board', icon: '👔' },
    { name: 'Bathtub', icon: '🛁' },
    { name: 'King Bed', icon: '🛏️' },
    { name: 'Work Desk', icon: '💼' }
  ];
  const [imagePreview, setImagePreview] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (parsedUser.role === 'admin' || parsedUser.role === 'manager' || parsedUser.role === 'receptionist') {
        setIsLoggedIn(true);
        setUser(parsedUser);
      }
    }
  }, []);

  // Fetch data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchAdminData();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Check if user has staff role
      if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'receptionist') {
        setError('Access denied. Staff only.');
        setLoginLoading(false);
        return;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setIsLoggedIn(true);
      setUser(user);
      setLoginLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setAllBookings([]);
    setOffers([]);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await api.get('/bookings');
      setAllBookings(bookingsRes.data);

      const offersRes = await api.get('/offers');
      setOffers(offersRes.data);

      const roomsRes = await api.get('/rooms');
      setRooms(roomsRes.data);

      const roomTypesRes = await api.get('/rooms/types');
      console.log('Room types fetched:', roomTypesRes.data);
      setRoomTypes(roomTypesRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch admin data');
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      fetchAdminData();
    } catch (err) {
      setError('Failed to update booking status');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewRoom({ ...newRoom, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('roomNumber', newRoom.roomNumber);
      formData.append('roomTypeId', parseInt(newRoom.roomTypeId));
      formData.append('floor', parseInt(newRoom.floor));
      formData.append('status', newRoom.status);
      formData.append('amenities', newRoom.amenities.join(', '));
      if (newRoom.image) {
        formData.append('image', newRoom.image);
      }

      if (editingRoom) {
        // Update existing room
        console.log('Updating room:', editingRoom.id);
        await api.put(`/rooms/${editingRoom.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Room updated successfully!');
        setEditingRoom(null);
      } else {
        // Create new room
        console.log('Creating room with image:', newRoom.image?.name);
        await api.post('/rooms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Room created successfully!');
      }
      
      setNewRoom({ roomNumber: '', roomTypeId: '', floor: '', status: 'available', image: null, amenities: [] });
      setImagePreview(null);
      fetchAdminData();
      setError('');
    } catch (err) {
      console.error('Error saving room:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to save room');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setNewRoom({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      floor: room.floor,
      status: room.status,
      image: null,
      amenities: room.amenities ? room.amenities.split(', ') : []
    });
    setImagePreview(room.image ? `http://localhost:5000${room.image}` : null);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setNewRoom({ roomNumber: '', roomTypeId: '', floor: '', status: 'available', image: null, amenities: [] });
    setImagePreview(null);
  };

  const handleAmenityToggle = (amenity) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await api.delete(`/rooms/${roomId}`);
      fetchAdminData();
      alert('Room deleted successfully!');
    } catch (err) {
      console.error('Error deleting room:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h2>🔑 Staff Portal</h2>
          <p className="login-subtitle">Authorized personnel only</p>
          
          {error && <div className="login-error">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@hotel.com"
                required
              />
            </div>
            <div className="login-field">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loginLoading} className="login-btn">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="login-help">
            <p><strong>Demo accounts:</strong></p>
            <p>admin@hotel.com / admin123</p>
            <p>manager@hotel.com / manager123</p>
            <p>reception@hotel.com / reception123</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <p>Loading...</p>;

  // Admin Dashboard
  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>🔑 Staff Portal</h2>
        <div className="admin-info">
          <span>Welcome, {user?.name} ({user?.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <h2>Admin Panel</h2>
      {error && <p className="error">{error}</p>}

      <div className="tabs">
        <button 
          className={selectedTab === 'bookings' ? 'active' : ''} 
          onClick={() => setSelectedTab('bookings')}
        >
          Bookings
        </button>
        <button 
          className={selectedTab === 'rooms' ? 'active' : ''} 
          onClick={() => setSelectedTab('rooms')}
        >
          Rooms
        </button>
        <button 
          className={selectedTab === 'offers' ? 'active' : ''} 
          onClick={() => setSelectedTab('offers')}
        >
          Offers
        </button>
      </div>

      {selectedTab === 'bookings' && (
        <div className="bookings-section">
          <h3>All Bookings</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{booking.User?.name}</td>
                  <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                  <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                  <td>ETB {booking.totalPrice}</td>
                  <td>{booking.status}</td>
                  <td>
                    <select onChange={(e) => updateBookingStatus(booking.id, e.target.value)}>
                      <option value="">-- Change Status --</option>
                      <option value="confirmed">Confirm</option>
                      <option value="checked_in">Check In</option>
                      <option value="checked_out">Check Out</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTab === 'rooms' && (
        <div className="rooms-section">
          <h3>Room Management</h3>
          
          <div className="create-room-form">
            <h4>{editingRoom ? '✏️ Edit Room' : '➕ Add New Room'}</h4>
            {editingRoom && (
              <p className="editing-notice">Editing Room {editingRoom.roomNumber}</p>
            )}
            <form onSubmit={handleCreateRoom}>
              <div className="form-row">
                <div className="form-group">
                  <label>Room Number:</label>
                  <input
                    type="text"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Room Type:</label>
                  <select
                    value={newRoom.roomTypeId}
                    onChange={(e) => setNewRoom({...newRoom, roomTypeId: e.target.value})}
                    required
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.basePrice} ETB
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Floor:</label>
                  <input
                    type="number"
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({...newRoom, floor: e.target.value})}
                    placeholder="e.g., 1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status:</label>
                  <select
                    value={newRoom.status}
                    onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file-input"
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Amenities:</label>
                <div className="amenities-checkboxes">
                  {commonAmenities.map((amenity) => (
                    <label key={amenity.name} className="amenity-checkbox">
                      <input
                        type="checkbox"
                        value={amenity.name}
                        checked={newRoom.amenities.includes(amenity.name)}
                        onChange={() => handleAmenityToggle(amenity.name)}
                      />
                      <span>{amenity.icon} {amenity.name}</span>
                    </label>
                  ))}
                </div>
                {newRoom.amenities.length > 0 && (
                  <div className="selected-amenities">
                    <strong>Selected:</strong> {newRoom.amenities.join(', ')}
                  </div>
                )}
              </div>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Room preview" />
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="create-btn">
                  {editingRoom ? 'Update Room' : 'Create Room'}
                </button>
                {editingRoom && (
                  <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rooms-list">
            <h4>All Rooms ({rooms.length})</h4>
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Room #</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      {room.image ? (
                        <img 
                          src={`http://localhost:5000${room.image}`} 
                          alt={`Room ${room.roomNumber}`}
                          className="room-thumbnail"
                        />
                      ) : (
                        <span className="no-image">No Image</span>
                      )}
                    </td>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomType?.name || 'N/A'}</td>
                    <td>{room.floor}</td>
                    <td>
                      <span className={`status-badge ${room.status}`}>
                        {room.status}
                      </span>
                    </td>
                    <td>
                      <div className="room-actions">
                        <button 
                          className="edit-btn" 
                          onClick={() => handleEditRoom(room)}
                          title="Edit Room"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Delete Room"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'offers' && (
        <div className="offers-section">
          <h3>Active Offers</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Discount</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td>{offer.name}</td>
                  <td>{offer.discountType === 'percentage' ? `${offer.discountValue}%` : `${offer.discountValue} ETB`}</td>
                  <td>{new Date(offer.startDate).toLocaleDateString()}</td>
                  <td>{new Date(offer.endDate).toLocaleDateString()}</td>
                  <td>{offer.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;