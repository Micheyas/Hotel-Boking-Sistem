import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

const commonAmenities = [
  'Free WiFi', 'Air Conditioning', 'Flat-screen TV', 'Smart TV',
  'Mini-bar', 'Premium Mini-bar', 'Room Service', '24/7 Room Service',
  'Private Balcony', 'City View', 'Ocean View', 'Butler Service',
  'Jacuzzi', 'King Bed', 'Work Desk', 'Safe Box',
  'Coffee Maker', 'Hair Dryer', 'Bathtub', 'Walk-in Closet',
];

const AdminPanel = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [offers, setOffers]           = useState([]);
  const [rooms, setRooms]             = useState([]);
  const [roomTypes, setRoomTypes]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // View: 'list' | 'room-management'
  const [view, setView]               = useState('list');

  // Booking filters
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Room form
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', roomNumber: '', roomTypeId: '', pricePerNight: '', floor: '', maxGuests: 2, roomSize: '', bedType: '', description: '', status: 'available', images: [], amenities: [] });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editingRoom, setEditingRoom]   = useState(null);

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser]             = useState(null);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const location = useLocation();

  // Clear session on page unload
  useEffect(() => {
    const clear = () => { sessionStorage.removeItem('staffToken'); sessionStorage.removeItem('staffUser'); };
    window.addEventListener('beforeunload', clear);
    return () => window.removeEventListener('beforeunload', clear);
  }, []);

  // Restore session
  useEffect(() => {
    const t = sessionStorage.getItem('staffToken');
    const u = sessionStorage.getItem('staffUser');
    if (t && u) { setIsLoggedIn(true); setUser(JSON.parse(u)); }
  }, []);

  // Auto-logout when leaving /admin
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      sessionStorage.removeItem('staffToken');
      sessionStorage.removeItem('staffUser');
      setIsLoggedIn(false); setUser(null);
      setAllBookings([]); setOffers([]);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isLoggedIn) fetchAdminData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      if (!['admin', 'manager', 'receptionist'].includes(user.role)) {
        setError('Access denied. Staff only.'); setLoginLoading(false); return;
      }
      sessionStorage.setItem('staffToken', token);
      sessionStorage.setItem('staffUser', JSON.stringify(user));
      // Remove any stale localStorage token to avoid conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(true); setUser(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('staffToken'); sessionStorage.removeItem('staffUser');
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setIsLoggedIn(false); setUser(null);
    setAllBookings([]); setOffers([]); setRooms([]);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const token = sessionStorage.getItem('staffToken');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const [bookingsRes, offersRes] = await Promise.all([
        api.get('/bookings', authHeader),
        api.get('/offers', authHeader),
      ]);
      setAllBookings(bookingsRes.data);
      setOffers(offersRes.data);

      const role = JSON.parse(sessionStorage.getItem('staffUser') || '{}').role;
      if (role !== 'receptionist') {
        const [roomsRes, typesRes] = await Promise.all([
          api.get('/rooms', authHeader),
          api.get('/rooms/types', authHeader),
        ]);
        setRooms(roomsRes.data);
        setRoomTypes(typesRes.data);
      } else {
        const roomsRes = await api.get('/rooms/available', authHeader);
        setRooms(roomsRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      if (err.response?.status === 401) handleLogout();
    } finally { setLoading(false); }
  };

  const handleVerifyPayment = async (bookingId, action) => {
    try {
      const token = sessionStorage.getItem('staffToken');
      await api.put(
        `/payments/${bookingId}/verify-proof`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to verify payment';
      setError(`Payment verification failed: ${msg}`);
      console.error('Verify payment error:', err.response?.status, err.response?.data);
    }
  };

  const handleImagesChange = (files) => {
    const fileArr = Array.from(files);
    const combined = [...newRoom.images, ...fileArr].slice(0, 3); // max 3
    setNewRoom(prev => ({ ...prev, images: combined }));
    const previews = combined.map(f => typeof f === 'string' ? f : URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index) => {
    const updated = newRoom.images.filter((_, i) => i !== index);
    setNewRoom(prev => ({ ...prev, images: updated }));
    setImagePreviews(updated.map(f => typeof f === 'string' ? f : URL.createObjectURL(f)));
  };

  const handleAmenityToggle = (name) => {
    setNewRoom(prev => ({
      ...prev,
      amenities: prev.amenities.includes(name) ? prev.amenities.filter(a => a !== name) : [...prev.amenities, name],
    }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('roomNumber', newRoom.roomNumber || newRoom.roomName);
      fd.append('roomTypeId', parseInt(newRoom.roomTypeId));
      fd.append('floor', parseInt(newRoom.floor) || 1);
      fd.append('status', newRoom.status);
      fd.append('amenities', JSON.stringify(newRoom.amenities));
      fd.append('maxGuests', newRoom.maxGuests);
      fd.append('roomSize', newRoom.roomSize);
      fd.append('bedType', newRoom.bedType);
      fd.append('description', newRoom.description);
      // Send up to 3 images (only File objects, not existing URL strings)
      newRoom.images
        .filter(img => img instanceof File)
        .slice(0, 3)
        .forEach(img => fd.append('images', img));

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setEditingRoom(null);
      } else {
        await api.post('/rooms', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      const emptyRoom = { roomName: '', roomNumber: '', roomTypeId: '', pricePerNight: '', floor: '', maxGuests: 2, roomSize: '', bedType: '', description: '', status: 'available', images: [], amenities: [] };
      setNewRoom(emptyRoom);
      setImagePreviews([]);
      setShowRoomModal(false);
      fetchAdminData(); setError('');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save room'); }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    let amenitiesArr = [];
    if (room.amenities) {
      try { amenitiesArr = JSON.parse(room.amenities); } catch { amenitiesArr = room.amenities.split(', ').filter(Boolean); }
    }
    setNewRoom({ roomName: room.roomNumber, roomNumber: room.roomNumber, roomTypeId: room.roomTypeId, pricePerNight: room.roomType?.basePrice || '', floor: room.floor, maxGuests: room.maxGuests || 2, roomSize: room.roomSize || '', bedType: room.bedType || '', description: room.description || '', status: room.status, images: [], amenities: amenitiesArr });
    // Load existing image URLs as strings for preview
    let existingImgs = [];
    try { existingImgs = JSON.parse(room.images || '[]'); } catch { existingImgs = []; }
    if (existingImgs.length === 0 && room.image) existingImgs = [room.image];
    setImagePreviews(existingImgs.map(p => p.startsWith('http') ? p : `http://localhost:5000${p}`));
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${roomId}`); fetchAdminData(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete room'); }
  };

  // Stats
  const totalBookings   = allBookings.length;
  const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
  const revenue = allBookings.filter(b => !['cancelled'].includes(b.status)).reduce((s, b) => s + Number(b.totalPrice || 0), 0);

  // Filtered bookings
  const filteredBookings = allBookings.filter(b => {
    const matchSearch = !search ||
      (b.User?.name || b.guestName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.guestEmail || b.User?.email || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search);
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // ── Login screen ──
  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h2>🔑 Staff Portal</h2>
          <p className="login-subtitle">Authorized personnel only</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@hotel.com" required />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loginLoading} className="login-btn">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="login-help">
            <p><strong>Demo accounts:</strong></p>
            <p>admin@hotel.com / admin123</p>
            <p>manager@hotel.com / manager123</p>
            <p>receptionist@hotel.com / receptionist123</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="admin-loading">Loading...</div>;

  // ── Dashboard ──
  return (
    <div className="admin-dashboard">

      {/* Top bar */}
      <div className="admin-topbar">
        <div>
          <h2 className="admin-title">2RN Solomon - {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Receptionist'} Dashboard</h2>
          <p className="admin-subtitle">Booking Management System</p>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">↪ Logout</button>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Stats cards — admin & manager only */}
      {isAdminOrManager && (
      <div className="admin-stats">
        <div className="stat-card-new">
          <div><p className="stat-label">Total Bookings</p><p className="stat-value">{totalBookings}</p></div>
          <span className="stat-icon">🛏</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Pending</p><p className="stat-value pending">{pendingBookings}</p></div>
          <span className="stat-icon">🕐</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Confirmed</p><p className="stat-value confirmed">{confirmedBookings}</p></div>
          <span className="stat-icon">✅</span>
        </div>
        <div className="stat-card-new">
          <div><p className="stat-label">Revenue</p><p className="stat-value revenue">ETB {revenue.toLocaleString()}</p></div>
          <span className="stat-icon">💰</span>
        </div>
      </div>
      )}

      {/* View tabs + search + filter */}
      <div className="admin-toolbar">
        <div className="admin-view-tabs">
          <button className={`view-tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            ☰ List View
          </button>
          {isAdminOrManager && (
            <button className={`view-tab ${view === 'room-management' ? 'active' : ''}`} onClick={() => setView('room-management')}>
              🏨 Room Management
            </button>
          )}
          <button className={`view-tab ${view === 'payments' ? 'active' : ''}`} onClick={() => setView('payments')}>
            💳 Payment Verification
            {allBookings.filter(b => b.paymentStatus === 'proof_submitted').length > 0 && (
              <span className="tab-badge">{allBookings.filter(b => b.paymentStatus === 'proof_submitted').length}</span>
            )}
          </button>
          <button className={`view-tab ${view === 'offers' ? 'active' : ''}`} onClick={() => setView('offers')}>
            🎁 Offers
          </button>
        </div>
        {view === 'list' && (
          <div className="admin-filters">
            <div className="admin-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search by name, email, or booking ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-status-filter">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* ── List View ── */}
      {view === 'list' && (
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>BOOKING ID</th>
                <th>GUEST</th>
                <th>ROOM</th>
                <th>DATES</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>PAYMENT</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan="7" className="no-results">No bookings found matching your criteria.</td></tr>
              ) : filteredBookings.map(b => (
                <tr key={b.id}>
                  <td>#{b.id}</td>
                  <td>
                    <div className="guest-cell">
                      <span className="guest-name">{b.User?.name || b.guestName || 'Guest'}</span>
                      <span className="guest-email">{b.User?.email || b.guestEmail || ''}</span>
                    </div>
                  </td>
                  <td>{b.room?.roomNumber ? `Room ${b.room.roomNumber}` : '—'}</td>
                  <td>
                    <span className="dates-cell">
                      {new Date(b.checkInDate).toLocaleDateString()} →<br/>
                      {new Date(b.checkOutDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td>ETB {Number(b.totalPrice).toLocaleString()}</td>
                  <td><span className={`status-pill ${b.status}`}>{b.status}</span></td>
                  <td className="payment-proof-cell">
                    {b.paymentProof ? (
                      <div className="proof-actions">
                        <a href={`http://localhost:5000${b.paymentProof}`} target="_blank" rel="noopener noreferrer">
                          <img src={`http://localhost:5000${b.paymentProof}`} alt="proof" className="proof-thumb" />
                        </a>
                        <span className={`payment-badge ${b.paymentStatus}`}>
                          {b.paymentStatus === 'proof_submitted' && '⏳ Pending'}
                          {b.paymentStatus === 'verified' && '✅ Verified'}
                          {b.paymentStatus === 'unpaid' && '❌ Rejected'}
                        </span>
                      </div>
                    ) : <span className="no-proof">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Room Management (Admin & Manager only) ── */}
      {view === 'room-management' && !isAdminOrManager && (
        <div className="access-denied">
          <span>🚫</span>
          <h3>Access Denied</h3>
          <p>Room Management is only available to <strong>Admin</strong> and <strong>Manager</strong>.</p>
        </div>
      )}

      {view === 'room-management' && isAdminOrManager && (
        <div className="room-mgmt-container">

          {/* Header bar */}
          <div className="room-mgmt-header">
            <h3>Room Management</h3>
            <button className="add-room-btn" onClick={() => { setEditingRoom(null); setNewRoom({ roomName:'', roomNumber:'', roomTypeId:'', pricePerNight:'', floor:'', maxGuests:2, roomSize:'', bedType:'', description:'', status:'available', images:[], amenities:[] }); setImagePreviews([]); setShowRoomModal(true); }}>
              + Add New Room
            </button>
          </div>

          {/* Room list table */}
          <div className="admin-table-card">
            <table className="admin-table">
              <thead>
                <tr><th>IMAGE</th><th>ROOM #</th><th>TYPE</th><th>FLOOR</th><th>BED</th><th>MAX GUESTS</th><th>SIZE</th><th>STATUS</th><th>ACTIONS</th></tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.image ? <img src={`http://localhost:5000${room.image}`} alt="" className="room-thumbnail" /> : <span className="no-image">—</span>}</td>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomType?.name || '—'}</td>
                    <td>{room.floor}</td>
                    <td>{room.bedType || '—'}</td>
                    <td>{room.maxGuests || '—'}</td>
                    <td>{room.roomSize || '—'}</td>
                    <td><span className={`status-pill ${room.status}`}>{room.status}</span></td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditRoom(room)}>✏️</button>
                      <button className="delete-btn" onClick={() => handleDeleteRoom(room.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal overlay */}
          {showRoomModal && (
            <div className="room-modal-overlay" onClick={() => setShowRoomModal(false)}>
              <div className="room-modal" onClick={e => e.stopPropagation()}>
                <div className="room-modal-header">
                  <h3>{editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Create New Room'}</h3>
                  <button className="modal-close-btn" onClick={() => setShowRoomModal(false)}>✕</button>
                </div>

                <form onSubmit={handleCreateRoom} className="room-modal-body">
                  {/* Left column */}
                  <div className="room-modal-left">

                    <div className="rm-field">
                      <label>Room Name <span className="req">*</span></label>
                      <input type="text" placeholder="e.g. Deluxe Ocean Suite" value={newRoom.roomName}
                        onChange={e => setNewRoom({...newRoom, roomName: e.target.value, roomNumber: e.target.value})} required />
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>Room Type</label>
                        <select value={newRoom.roomTypeId} onChange={e => setNewRoom({...newRoom, roomTypeId: e.target.value})} required>
                          <option value="">Select type</option>
                          {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div className="rm-field">
                        <label>Price/Night (Birr) <span className="req">*</span></label>
                        <input type="number" placeholder="e.g. 2500" value={newRoom.pricePerNight}
                          onChange={e => setNewRoom({...newRoom, pricePerNight: e.target.value})} />
                      </div>
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>👤 Max Guests</label>
                        <input type="number" min="1" max="10" value={newRoom.maxGuests}
                          onChange={e => setNewRoom({...newRoom, maxGuests: e.target.value})} />
                      </div>
                      <div className="rm-field">
                        <label>Room Size</label>
                        <input type="text" placeholder="42 sqm" value={newRoom.roomSize}
                          onChange={e => setNewRoom({...newRoom, roomSize: e.target.value})} />
                      </div>
                    </div>

                    <div className="rm-field">
                      <label>🛏 Bed Type</label>
                      <input type="text" placeholder="King, Queen, Twin..." value={newRoom.bedType}
                        onChange={e => setNewRoom({...newRoom, bedType: e.target.value})} />
                    </div>

                    <div className="rm-field">
                      <label>Description</label>
                      <textarea rows={4} placeholder="Describe the room..." value={newRoom.description}
                        onChange={e => setNewRoom({...newRoom, description: e.target.value})} />
                    </div>

                    <div className="rm-row">
                      <div className="rm-field">
                        <label>Floor</label>
                        <input type="number" placeholder="1" value={newRoom.floor}
                          onChange={e => setNewRoom({...newRoom, floor: e.target.value})} />
                      </div>
                      <div className="rm-field">
                        <label>Status</label>
                        <select value={newRoom.status} onChange={e => setNewRoom({...newRoom, status: e.target.value})}>
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="room-modal-right">
                    <div className="rm-field">
                      <label>Amenities</label>
                      <div className="amenities-grid">
                        {commonAmenities.map(name => (
                          <label key={name} className="amenity-check-item">
                            <input type="checkbox" checked={newRoom.amenities.includes(name)}
                              onChange={() => handleAmenityToggle(name)} />
                            {name}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rm-field" style={{marginTop:'20px'}}>
                      <label>Room Images <span style={{color:'#9ca3af',fontWeight:400}}>(up to 3)</span></label>
                      {imagePreviews.length === 0 && (
                        <p className="no-images-text">No images uploaded yet</p>
                      )}
                      <div className="image-previews-row">
                        {imagePreviews.map((src, i) => (
                          <div key={i} className="img-preview-wrap">
                            <img src={src} alt="preview" className="img-preview-thumb" />
                            <button type="button" className="img-remove-btn" onClick={() => handleRemoveImage(i)}>✕</button>
                          </div>
                        ))}
                      </div>
                      {imagePreviews.length < 3 && (
                        <label className="image-drop-zone">
                          <input type="file" accept="image/*" multiple style={{display:'none'}}
                            onChange={e => handleImagesChange(e.target.files)} />
                          <div className="drop-zone-inner">
                            <span className="drop-icon">⬆</span>
                            <p>Drop images here or click to upload</p>
                            <small>{3 - imagePreviews.length} slot{3 - imagePreviews.length !== 1 ? 's' : ''} remaining · JPG, PNG, WebP up to 5MB</small>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="room-modal-footer">
                    <button type="button" className="cancel-btn" onClick={() => setShowRoomModal(false)}>Cancel</button>
                    <button type="submit" className="create-room-btn">🏠 {editingRoom ? 'Update Room' : 'Create Room'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payment Verification ── */}
      {view === 'payments' && (
        <div className="admin-table-card">
          <div className="payment-verify-header">
            <h3>💳 Payment Verification</h3>
            <p className="payment-verify-sub">Review and approve guest payment screenshots</p>
          </div>

          {/* Pending proofs first */}
          {(() => {
            const pending  = allBookings.filter(b => b.paymentStatus === 'proof_submitted');
            const verified = allBookings.filter(b => b.paymentStatus === 'verified');
            const rejected = allBookings.filter(b => b.paymentStatus === 'unpaid' && b.paymentProof === null && b.totalPrice > 0);
            const noproof  = allBookings.filter(b => !b.paymentProof && b.paymentStatus !== 'verified');

            return (
              <>
                {/* Pending */}
                <div className="pv-section">
                  <h4 className="pv-section-title pv-pending">
                    ⏳ Awaiting Verification ({pending.length})
                  </h4>
                  {pending.length === 0 ? (
                    <p className="pv-empty">No pending payment proofs.</p>
                  ) : (
                    <div className="pv-cards">
                      {pending.map(b => (
                        <div key={b.id} className="pv-card pv-card--pending">
                          <div className="pv-card-top">
                            <div className="pv-info">
                              <span className="pv-booking-id">Booking #{b.id}</span>
                              <span className="pv-guest">{b.User?.name || b.guestName || 'Guest'}</span>
                              <span className="pv-email">{b.User?.email || b.guestEmail || ''}</span>
                              <span className="pv-amount">ETB {Number(b.totalPrice).toLocaleString()}</span>
                              <span className="pv-dates">
                                {new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}
                              </span>
                            </div>
                            <a href={`http://localhost:5000${b.paymentProof}`} target="_blank" rel="noopener noreferrer" className="pv-proof-link">
                              <img src={`http://localhost:5000${b.paymentProof}`} alt="Payment proof" className="pv-proof-img" />
                              <span className="pv-view-text">View full image</span>
                            </a>
                          </div>
                          <div className="pv-actions">
                            <button className="pv-approve-btn" onClick={() => handleVerifyPayment(b.id, 'approve')}>
                              ✅ Approve Payment
                            </button>
                            <button className="pv-reject-btn" onClick={() => handleVerifyPayment(b.id, 'reject')}>
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified */}
                {verified.length > 0 && (
                  <div className="pv-section">
                    <h4 className="pv-section-title pv-verified">✅ Verified ({verified.length})</h4>
                    <div className="pv-cards">
                      {verified.map(b => (
                        <div key={b.id} className="pv-card pv-card--verified">
                          <div className="pv-info">
                            <span className="pv-booking-id">Booking #{b.id}</span>
                            <span className="pv-guest">{b.User?.name || b.guestName || 'Guest'}</span>
                            <span className="pv-amount">ETB {Number(b.totalPrice).toLocaleString()}</span>
                          </div>
                          <span className="pv-badge pv-badge--verified">✅ Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Offers ── */}
      {view === 'offers' && (
        <div className="admin-table-card">
          <h3>Active Offers</h3>
          <table className="admin-table">
            <thead>
              <tr><th>NAME</th><th>DISCOUNT</th><th>VALID FROM</th><th>VALID TO</th><th>STATUS</th></tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.discountType === 'percentage' ? `${o.discountValue}%` : `ETB ${o.discountValue}`}</td>
                  <td>{new Date(o.startDate).toLocaleDateString()}</td>
                  <td>{new Date(o.endDate).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${o.status}`}>{o.status}</span></td>
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
