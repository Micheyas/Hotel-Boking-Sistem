import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('bookings');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Unauthorized access');
      return;
    }
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const bookingsRes = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllBookings(bookingsRes.data);

      const offersRes = await axios.get('http://localhost:5000/api/offers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(offersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminData();
    } catch (err) {
      setError('Failed to update booking status');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="admin-panel">
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