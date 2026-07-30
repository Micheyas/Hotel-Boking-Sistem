import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { getCustomerToken, getCustomerUser, logoutCustomer } from "./CustomerAuth";
import "../styles/ProfileSetup.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const token = getCustomerToken();
  const user  = getCustomerUser();

  const [kycStatus, setKycStatus] = useState(null); // null | pending | submitted | approved | rejected
  const [rejectedReason, setRejectedReason] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form fields
  const [phone, setPhone]             = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [idType, setIdType]           = useState("national_id");
  const [idFront, setIdFront]         = useState(null);
  const [idBack, setIdBack]           = useState(null);
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack]   = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!token || !user) { navigate("/login"); return; }
    fetchKycStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchKycStatus = async () => {
    try {
      const res = await axios.get(API + "/auth/kyc/status", {
        headers: { Authorization: "Bearer " + token },
      });
      setKycStatus(res.data.kycStatus);
      setRejectedReason(res.data.kycRejectedReason || "");
      if (res.data.phone)       setPhone(res.data.phone);
      if (res.data.nationality) setNationality(res.data.nationality);
      if (res.data.idType)      setIdType(res.data.idType);
    } catch {
      setKycStatus("pending");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileChange = (side) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (side === "front") { setIdFront(file); setPreviewFront(URL.createObjectURL(file)); }
    else                  { setIdBack(file);  setPreviewBack(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!phone || !dateOfBirth || !nationality) {
      setError("Please fill in all personal information fields."); return;
    }
    if (!idFront) {
      setError("Please upload the front of your ID document."); return;
    }
    if (idType === "national_id" && !idBack) {
      setError("Please upload the back of your National ID."); return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("phone",       phone.trim());
      fd.append("dateOfBirth", dateOfBirth);
      fd.append("nationality", nationality.trim());
      fd.append("idType",      idType);
      fd.append("idFront",     idFront);
      if (idBack) fd.append("idBack", idBack);

      await axios.post(API + "/auth/kyc", fd, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data",
        },
      });

      setKycStatus("submitted");
      setSuccess("Your documents have been submitted! Staff will review within 24 hours.");

      // Update stored user with new kycStatus
      const updatedUser = { ...user, kycStatus: "submitted" };
      localStorage.setItem("customerUser", JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token || !user) return null;
  if (loadingStatus) return <div className="ps-loading">Loading…</div>;

  // ── Already approved ──────────────────────────────────
  if (kycStatus === "approved") {
    return (
      <div className="ps-page">
        <div className="ps-card">
          <div className="ps-status-icon">✅</div>
          <h2>Identity Verified</h2>
          <p>Your identity has been verified. You can now book rooms.</p>
          <Link to="/booking" className="ps-btn">Book a Room →</Link>
          <Link to="/" className="ps-link">Back to Home</Link>
        </div>
      </div>
    );
  }

  // ── Submitted — waiting review ────────────────────────
  if (kycStatus === "submitted") {
    return (
      <div className="ps-page">
        <div className="ps-card">
          <div className="ps-status-icon">⏳</div>
          <h2>Under Review</h2>
          <p>Your documents have been submitted and are being reviewed by our staff.</p>
          <p className="ps-sub">This usually takes less than 24 hours. You'll be notified once approved.</p>
          <Link to="/" className="ps-link">Back to Home</Link>
          <button
            className="ps-logout-link"
            onClick={() => { logoutCustomer(); navigate("/login"); }}
          >
            ↪ Log out
          </button>
        </div>
      </div>
    );
  }

  // ── Rejected — resubmit ───────────────────────────────
  const isRejected = kycStatus === "rejected";

  // ── Form (pending or rejected) ────────────────────────
  return (
    <div className="ps-page">
      <div className="ps-card ps-card--form">

        {/* Header */}
        <div className="ps-header">
          <Link to="/" className="ps-logo">2RN Solomon Hotel</Link>
          <h2 className="ps-title">
            {isRejected ? "Resubmit Your Documents" : "Complete Your Profile"}
          </h2>
          <p className="ps-subtitle">
            {isRejected
              ? "Your previous submission was rejected. Please resubmit with valid documents."
              : "One last step before you can book. Please provide your personal information and a valid ID."}
          </p>
        </div>

        {/* Rejection reason */}
        {isRejected && rejectedReason && (
          <div className="ps-rejected-box">
            <span className="ps-rejected-icon">❌</span>
            <div>
              <strong>Rejection reason:</strong>
              <p>{rejectedReason}</p>
            </div>
          </div>
        )}

        <form className="ps-form" onSubmit={handleSubmit}>

          {/* Personal Info */}
          <div className="ps-section-title">👤 Personal Information</div>

          <div className="ps-row">
            <div className="ps-field">
              <label>Full Name</label>
              <input type="text" value={user.name} disabled className="ps-input ps-input--disabled" />
            </div>
            <div className="ps-field">
              <label>Email</label>
              <input type="email" value={user.email} disabled className="ps-input ps-input--disabled" />
            </div>
          </div>

          <div className="ps-row">
            <div className="ps-field">
              <label>Phone Number <span className="ps-req">*</span></label>
              <input
                type="tel" required
                placeholder="+251 9xx xxx xxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="ps-input"
              />
            </div>
            <div className="ps-field">
              <label>Date of Birth <span className="ps-req">*</span></label>
              <input
                type="date" required
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="ps-input"
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="ps-field">
            <label>Nationality <span className="ps-req">*</span></label>
            <input
              type="text" required
              placeholder="e.g. Ethiopian"
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              className="ps-input"
            />
          </div>

          {/* ID Document */}
          <div className="ps-section-title">🪪 Identity Document</div>

          <div className="ps-field">
            <label>Document Type <span className="ps-req">*</span></label>
            <div className="ps-id-type-row">
              <button
                type="button"
                className={"ps-id-type-btn" + (idType === "national_id" ? " ps-id-type-btn--active" : "")}
                onClick={() => setIdType("national_id")}
              >
                🪪 National ID (FIDA)
              </button>
              <button
                type="button"
                className={"ps-id-type-btn" + (idType === "passport" ? " ps-id-type-btn--active" : "")}
                onClick={() => setIdType("passport")}
              >
                📘 Passport
              </button>
            </div>
          </div>

          {/* Front upload */}
          <div className="ps-field">
            <label>
              {idType === "national_id" ? "National ID — Front Side" : "Passport — Photo Page"}
              <span className="ps-req"> *</span>
            </label>
            <label className="ps-upload-area">
              {previewFront ? (
                <img src={previewFront} alt="ID Front" className="ps-id-preview" />
              ) : (
                <div className="ps-upload-inner">
                  <span className="ps-upload-icon">📷</span>
                  <span className="ps-upload-text">Click to upload</span>
                  <span className="ps-upload-hint">JPG, PNG or PDF · Max 10MB</span>
                </div>
              )}
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange("front")} className="ps-hidden-input" />
            </label>
            {previewFront && (
              <button type="button" className="ps-remove-btn" onClick={() => { setIdFront(null); setPreviewFront(null); }}>
                ✕ Remove
              </button>
            )}
          </div>

          {/* Back upload — only for national ID */}
          {idType === "national_id" && (
            <div className="ps-field">
              <label>National ID — Back Side <span className="ps-req">*</span></label>
              <label className="ps-upload-area">
                {previewBack ? (
                  <img src={previewBack} alt="ID Back" className="ps-id-preview" />
                ) : (
                  <div className="ps-upload-inner">
                    <span className="ps-upload-icon">📷</span>
                    <span className="ps-upload-text">Click to upload back side</span>
                    <span className="ps-upload-hint">JPG, PNG or PDF · Max 10MB</span>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange("back")} className="ps-hidden-input" />
              </label>
              {previewBack && (
                <button type="button" className="ps-remove-btn" onClick={() => { setIdBack(null); setPreviewBack(null); }}>
                  ✕ Remove
                </button>
              )}
            </div>
          )}

          {/* Notice */}
          <div className="ps-notice">
            <span>🔒</span>
            <span>Your documents are encrypted and stored securely. They are only used to verify your identity and will not be shared with third parties.</span>
          </div>

          {error   && <p className="ps-error">{error}</p>}
          {success && <p className="ps-success">{success}</p>}

          <button type="submit" className="ps-submit-btn" disabled={submitting}>
            {submitting ? "Uploading…" : "Submit for Verification"}
          </button>

        </form>

        <button className="ps-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
          ↪ Log out and use a different account
        </button>
      </div>
    </div>
  );
};

export default ProfileSetup;
