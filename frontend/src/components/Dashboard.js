import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ totalBookings: 0, activeOffers: 0, occupancyRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token) {
      setError('Please login first');
      return;
    }
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const bookingsRes = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(bookingsRes.data);

      // Calculate stats
      setStats({
        totalBookings: bookingsRes.data.length,
        activeOffers: Math.floor(Math.random() * 5) + 1, // Mock data
        occupancyRate: Math.floor(Math.random() * 100) + '%',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h2>Welcome, {user.name}</h2>
      {error && <p className="error">{error}</p>}

      <div className="stats">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{stats.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Active Offers</h3>
          <p>{stats.activeOffers}</p>
        </div>
        <div className="stat-card">
          <h3>Occupancy Rate</h3>
          <p>{stats.occupancyRate}</p>
        </div>
      </div>

      <div className="bookings-section">
        <h3>Your Bookings</h3>
        {bookings.length === 0 ? (
          <p>No bookings yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Total Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.id}</td>
                  <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                  <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                  <td>ETB {booking.totalPrice}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;