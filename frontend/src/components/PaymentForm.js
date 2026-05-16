import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

const BANK_DETAILS = [
  { label: 'Bank Name',      value: 'Grand National Bank' },
  { label: 'Account Name',   value: '2RN Solomon Ltd' },
  { label: 'Account Number', value: '1234-5678-9012-3456' },
  { label: 'Branch',         value: 'Main Branch - 001' },
  { label: 'SWIFT Code',     value: 'GNBAUS33' },
];

const TIMER_SECONDS = 5 * 60;

const IMPORTANT_NOTES = [
  'Your room is held for 5 minutes pending payment verification.',
  'Please complete the transfer within this time to secure your booking.',
  'Confirmation email will be sent within 24 hours of verification.',
  'For assistance, contact us at +1 (555) 123-4567.',
];

const PaymentForm = ({ bookingId: propBookingId, amount: propAmount }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = propBookingId || searchParams.get('bookingId');
  const amount    = propAmount    || searchParams.get('amount');

  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [txnRef, setTxnRef]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState('');
  const [seconds, setSeconds]   = useState(TIMER_SECONDS);

  /* countdown */
  useEffect(() => {
    if (success) return;
    const id = setInterval(() => {
      setSeconds(s => (s <= 1 ? (clearInterval(id), 0) : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [success]);

  const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleCopy = (value, label) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 1800);
    });
  };

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file)      { setError('A payment screenshot is required.'); return; }
    if (!bookingId) { setError('Booking ID missing. Please go back and try again.'); return; }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('paymentProof', file);
      if (txnRef.trim()) fd.append('transactionRef', txnRef.trim());
      await api.post(`/payments/${bookingId}/upload-proof`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── success ── */
  if (success) {
    return (
      <div className="pf-page">
        <div className="pf-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
          <h3 style={{ color: '#2e7d32', margin: '0 0 10px' }}>Payment Proof Submitted!</h3>
          <p style={{ color: '#555', marginBottom: 24 }}>
            Our staff will review your screenshot and confirm your booking shortly.
          </p>
          <button className="pf-confirm-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">

      {/* Back */}
      <button className="pf-back-btn" onClick={() => navigate(-1)}>← Back</button>

      {/* Title */}
      <div className="pf-title-block">
        <h2 className="pf-title">Complete Your Payment</h2>
        <p className="pf-subtitle">Follow the steps below to complete your reservation</p>
      </div>

      {/* Timer */}
      <div className={`pf-timer-banner${seconds < 60 ? ' pf-timer-banner--urgent' : ''}`}>
        <div className="pf-timer-top">
          <span className="pf-timer-icon">🕐</span>
          <span className="pf-timer-text">
            Time remaining: <strong>{formatTime(seconds)}</strong>
          </span>
        </div>
        <p className="pf-timer-sub">Complete your payment before time runs out to secure your booking</p>
      </div>

      {/* Stepper */}
      <div className="pf-stepper">
        <div className="pf-step pf-step--done">
          <div className="pf-step-circle pf-step-circle--done">✓</div>
          <span className="pf-step-label">Details</span>
        </div>
        <div className="pf-step-line pf-step-line--done" />
        <div className="pf-step pf-step--active">
          <div className="pf-step-circle pf-step-circle--active">2</div>
          <span className="pf-step-label pf-step-label--active">Payment</span>
        </div>
        <div className="pf-step-line" />
        <div className="pf-step">
          <div className="pf-step-circle">3</div>
          <span className="pf-step-label">Confirmation</span>
        </div>
      </div>

      {/* ── Bank Details Card ── */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">🏦</span> Bank Transfer Details
        </h4>

        <div className="pf-bank-list">
          {BANK_DETAILS.map(({ label, value }) => (
            <div key={label} className="pf-bank-row">
              <div className="pf-bank-info">
                <span className="pf-bank-label">{label}</span>
                <span className="pf-bank-value">{value}</span>
              </div>
              <button
                className={`pf-copy-btn${copied === label ? ' pf-copy-btn--done' : ''}`}
                onClick={() => handleCopy(value, label)}
                title={`Copy ${label}`}
                type="button"
              >
                {copied === label ? '✓' : '⧉'}
              </button>
            </div>
          ))}
        </div>

        {/* Amount box */}
        <div className="pf-amount-box">
          <span className="pf-amount-label">
            <span>💳</span> Amount to Transfer
          </span>
          <span className="pf-amount-value">
            {amount ? `Br${Number(amount).toLocaleString()}` : 'See booking details'}
          </span>
        </div>
      </div>

      {/* ── Confirm Payment Card ── */}
      <div className="pf-card">
        <h4 className="pf-card-heading">
          <span className="pf-card-heading-icon">📄</span> Confirm Your Payment
        </h4>

        {error && <div className="pf-error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="pf-form">

          {/* Upload area */}
          <div className="pf-field">
            <label className="pf-field-label">
              Payment Screenshot <span className="pf-required">*</span>
            </label>
            <label className="pf-upload-area">
              {preview ? (
                <img src={preview} alt="Payment proof" className="pf-preview-img" />
              ) : (
                <>
                  <span className="pf-upload-img-icon">🖼</span>
                  <span className="pf-upload-main-text">Click to upload payment screenshot</span>
                  <span className="pf-upload-hint-text">Upload your bank transfer receipt or payment confirmation</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="pf-hidden-input"
              />
            </label>
            {preview && (
              <button
                type="button"
                className="pf-remove-link"
                onClick={() => { setFile(null); setPreview(null); }}
              >
                Remove image
              </button>
            )}
          </div>

          {/* OR divider */}
          <div className="pf-or-divider">
            <span className="pf-or-line" />
            <span className="pf-or-text">OR</span>
            <span className="pf-or-line" />
          </div>

          {/* Transaction ref */}
          <div className="pf-field">
            <label className="pf-field-label">
              Transaction Reference Number <span className="pf-optional">(Optional)</span>
            </label>
            <input
              type="text"
              className="pf-text-input"
              placeholder="e.g., TXN123456789"
              value={txnRef}
              onChange={e => setTxnRef(e.target.value)}
            />
            <span className="pf-field-hint">Enter the transaction ID from your bank receipt (optional)</span>
          </div>

          {/* Info note */}
          <div className="pf-info-note">
            <span className="pf-info-icon">ℹ️</span>
            <span>
              A payment screenshot is required for verification. You may optionally provide a
              transaction reference number as well.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !file}
            className="pf-confirm-btn"
          >
            {loading ? 'Uploading…' : 'Confirm Payment Details'}
          </button>
        </form>
      </div>

      {/* ── Important Notes ── */}
      <div className="pf-notes-card">
        <h4 className="pf-notes-title">Important Notes</h4>
        <ul className="pf-notes-list">
          {IMPORTANT_NOTES.map((note, i) => (
            <li key={i} className="pf-notes-item">
              <span className="pf-notes-check">✓</span>
              {note}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default PaymentForm;
