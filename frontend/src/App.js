import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

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
                  <Link to="/admin">Admin Panel</Link>
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