import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import PaymentForm from './components/PaymentForm';
import ReviewForm from './components/ReviewForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Connect to WebSocket for realtime updates
    if (token) {
      const socket = io('http://localhost:5000', {
        auth: { token },
      });

      socket.on('roomStatusChanged', (data) => {
        console.log('Room status updated:', data);
        // Trigger UI update if needed
      });

      return () => socket.disconnect();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🏨 Hotel Booking Management System</h1>
          <nav>
            <Link to="/">Home</Link>
            {!token ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <Link to="/booking">Book Room</Link>
                <Link to="/dashboard">Dashboard</Link>
                {user.role === 'admin' || user.role === 'manager' ? (
                  <>
                    <Link to="/admin">Admin Panel</Link>
                    <Link to="/analytics">Analytics</Link>
                  </>
                ) : null}
                <button onClick={handleLogout} className="logout-btn">Logout ({user.name})</button>
              </>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/booking" element={token ? <BookingForm /> : <Login />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Login />} />
            <Route path="/admin" element={token && (user.role === 'admin' || user.role === 'manager') ? <AdminPanel /> : <Login />} />
            <Route path="/analytics" element={token && (user.role === 'admin' || user.role === 'manager') ? <AnalyticsDashboard /> : <Login />} />
            <Route path="/payment" element={token ? <PaymentForm /> : <Login />} />
            <Route path="/reviews/:roomId" element={<ReviewForm roomId={new URLSearchParams(window.location.search).get('roomId')} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  const token = localStorage.getItem('token');
  return (
    <div className="home">
      <h2>Welcome to Hotel Booking Management System</h2>
      <p>Book your perfect room with easy online reservations and multi-currency support</p>
      {!token ? (
        <div className="cta-buttons">
          <a href="/register" className="btn">Get Started</a>
          <a href="/login" className="btn secondary">Login</a>
        </div>
      ) : (
        <div className="cta-buttons">
          <a href="/booking" className="btn">Book a Room</a>
          <a href="/dashboard" className="btn secondary">My Dashboard</a>
        </div>
      )}
    </div>
  );
}

export default App;