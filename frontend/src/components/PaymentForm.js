import React, { useState } from 'react';
import api from '../api';

const PaymentForm = ({ bookingId, amount, roomType }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please attach your payment screenshot first.');
      return;
    }
    if (!bookingId) {
      setError('Booking ID is missing. Please go back and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('paymentProof', file);

      await api.post(`/payments/${bookingId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="payment-form">
        <div className="payment-success-box">
          <span className="success-icon">✅</span>
          <h3>Payment Proof Submitted!</h3>
          <p>Our staff will review your payment screenshot and confirm your booking shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-form">
      <h3>💳 Submit Payment Proof</h3>
      <p className="payment-instructions">
        Please complete your payment via bank transfer or mobile money, then upload a
        screenshot or photo of your payment confirmation below.
      </p>

      {/* Payment details */}
      <div className="payment-info">
        {roomType && <p>Room: <strong>{roomType}</strong></p>}
        {amount && <p>Amount: <strong>ETB {amount}</strong></p>}
      </div>

      {/* Bank / payment details */}
      <div className="bank-details">
        <h4>📋 Payment Details</h4>
        <p><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
        <p><strong>Account Name:</strong> The William Vale Hotel</p>
        <p><strong>Account Number:</strong> 1000123456789</p>
        <p><strong>Reference:</strong> Booking #{bookingId || 'your booking ID'}</p>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="proof-upload-form">
        <label className="upload-label">
          <span>📎 Attach Payment Screenshot</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </label>

        {preview && (
          <div className="proof-preview">
            <p>Preview:</p>
            <img src={preview} alt="Payment proof preview" className="proof-image" />
          </div>
        )}

        <button type="submit" disabled={loading || !file} className="payment-btn">
          {loading ? 'Uploading...' : '📤 Submit Payment Proof'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
