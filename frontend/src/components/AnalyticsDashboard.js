import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/analytics',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="analytics-dashboard">
      <h2>📊 Analytics Dashboard</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Total Bookings</h4>
          <p className="metric">{analytics?.totalBookings || 0}</p>
        </div>
        <div className="analytics-card">
          <h4>Total Revenue</h4>
          <p className="metric">ETB {(analytics?.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="analytics-card">
          <h4>Occupancy Rate</h4>
          <p className="metric">{analytics?.occupancyRate || 0}%</p>
        </div>
      </div>

      <div className="booking-status-breakdown">
        <h3>Booking Status Breakdown</h3>
        <div className="status-chart">
          {analytics?.statusBreakdown?.map((item) => (
            <div key={item.status} className="status-item">
              <span className="status-name">{item.status}:</span>
              <div className="status-bar">
                <div
                  className="status-fill"
                  style={{
                    width: `${(item.count / (analytics.totalBookings || 1)) * 100}%`,
                  }}
                >
                  {item.count}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={fetchAnalytics} className="refresh-btn">🔄 Refresh Data</button>
    </div>
  );
};

export default AnalyticsDashboard;