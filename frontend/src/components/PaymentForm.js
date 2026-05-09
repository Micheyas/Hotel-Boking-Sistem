import React, { useState } from 'react';
import axios from 'axios';

const PaymentForm = ({ bookingId, amount, roomType }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/payments/create-checkout-session',
        {
          amount: amount / 100, // Convert to dollars
          roomType,
          customerEmail: user.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h3>Complete Payment</h3>
      {error && <p className="error">{error}</p>}
      <div className="payment-info">
        <p>Room: <strong>{roomType}</strong></p>
        <p>Amount: <strong>ETB {amount}</strong></p>
      </div>
      <button onClick={handlePayment} disabled={loading} className="payment-btn">
        {loading ? 'Processing...' : 'Proceed to Payment'}
      </button>
    </div>
  );
};

export default PaymentForm;