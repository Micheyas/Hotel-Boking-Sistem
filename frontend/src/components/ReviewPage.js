import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../api";
import { useI18n } from "../LanguageContext";
import { FAQAndLocation, FooterBar } from "./Footer";
import "../styles/ReviewPage.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/* ─── helpers ────────────────────────────────────────────── */
const StarRow = ({ value, onChange, readonly = false, size = "md" }) => {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className={"rp-stars rp-stars--" + size + (readonly ? " rp-stars--readonly" : "")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={"rp-star" + (n <= display ? " rp-star--on" : "")}
          onClick={() => !readonly && onChange && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          role={readonly ? undefined : "button"}
          aria-label={readonly ? undefined : "Rate " + n + " stars"}
          tabIndex={readonly ? undefined : 0}
          onKeyDown={(e) => !readonly && e.key === "Enter" && onChange && onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const RatingBar = ({ label, value }) => (
  <div className="rp-ratingbar">
    <span className="rp-ratingbar-label">{label}</span>
    <div className="rp-ratingbar-track">
      <div className="rp-ratingbar-fill" style={{ width: (value / 5) * 100 + "%" }} />
    </div>
    <span className="rp-ratingbar-val">{value ? value.toFixed(1) : "—"}</span>
  </div>
);

const DistributionBar = ({ distribution, total }) => (
  <div className="rp-dist">
    {[5, 4, 3, 2, 1].map((star) => {
      const count = distribution?.[star] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      return (
        <div key={star} className="rp-dist-row">
          <span className="rp-dist-star">{star} ★</span>
          <div className="rp-dist-track">
            <div className="rp-dist-fill" style={{ width: pct + "%" }} />
          </div>
          <span className="rp-dist-count">{count}</span>
        </div>
      );
    })}
  </div>
);

// ── Tab: Hotel Overall ────────────────────────────────────
const HotelReviewTab = ({ token, onNewReview }) => {
  const { t } = useI18n();
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [locationRating, setLocationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, revRes] = await Promise.all([
        axios.get(API + "/reviews/summary"),
        axios.get(API + "/reviews?reviewType=hotel"),
      ]);
      setSummary(sumRes.data);
      setReviews(revRes.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { setError(t("review.errorLogin")); return; }
    if (!rating) { setError("Please select an overall rating."); return; }
    setSubmitting(true); setError("");
    try {
      await axios.post(
        API + "/reviews",
        { reviewType: "hotel", rating, cleanlinessRating, staffRating, locationRating, valueRating, comment },
        { headers: { Authorization: "Bearer " + token } },
      );
      setSuccess(t("review.success"));
      setRating(0); setCleanlinessRating(0); setStaffRating(0);
      setLocationRating(0); setValueRating(0); setComment("");
      setTimeout(() => { setSuccess(""); fetchData(); onNewReview && onNewReview(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t("review.errorLogin"));
    } finally { setSubmitting(false); }
  };

  const hotelSummary = summary?.hotel;

  return (
    <div className="rp-tab-content">
      {!loading && hotelSummary && (
        <div className="rp-summary-card">
          <div className="rp-summary-left">
            <div className="rp-big-score">{hotelSummary.averageRating ?? "—"}</div>
            <div className="rp-big-stars">
              <StarRow value={Math.round(hotelSummary.averageRating || 0)} readonly size="lg" />
            </div>
            <div className="rp-big-count">{hotelSummary.count} review{hotelSummary.count !== 1 ? "s" : ""}</div>
          </div>
          <div className="rp-summary-right">
            <DistributionBar distribution={hotelSummary.distribution} total={hotelSummary.count} />
          </div>
          {hotelSummary.subRatings && (
            <div className="rp-summary-sub">
              <RatingBar label="🧹 Cleanliness" value={hotelSummary.subRatings.cleanliness} />
              <RatingBar label="👋 Staff"       value={hotelSummary.subRatings.staff} />
              <RatingBar label="📍 Location"    value={hotelSummary.subRatings.location} />
              <RatingBar label="💰 Value"       value={hotelSummary.subRatings.value} />
            </div>
          )}
        </div>
      )}
      <div className="rp-form-card">
        <h3 className="rp-form-title">✍️ Share Your Hotel Experience</h3>
        <form onSubmit={handleSubmit} className="rp-form">
          <div className="rp-field">
            <label className="rp-label">Overall Rating <span className="rp-required">*</span></label>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <div className="rp-subratings-grid">
            <div className="rp-field"><label className="rp-label">🧹 Cleanliness</label><StarRow value={cleanlinessRating} onChange={setCleanlinessRating} size="sm" /></div>
            <div className="rp-field"><label className="rp-label">👋 Staff</label><StarRow value={staffRating} onChange={setStaffRating} size="sm" /></div>
            <div className="rp-field"><label className="rp-label">📍 Location</label><StarRow value={locationRating} onChange={setLocationRating} size="sm" /></div>
            <div className="rp-field"><label className="rp-label">💰 Value for Money</label><StarRow value={valueRating} onChange={setValueRating} size="sm" /></div>
          </div>
          <div className="rp-field">
            <label className="rp-label">Your Comment</label>
            <textarea className="rp-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us about your stay…" rows={4} />
          </div>
          {error   && <p className="rp-error">{error}</p>}
          {success && <p className="rp-success">{success}</p>}
          <button type="submit" className="rp-submit-btn" disabled={submitting}>
            {submitting ? t("review.submitting") : t("review.submit")}
          </button>
        </form>
      </div>
      <ReviewList reviews={reviews} loading={loading} />
    </div>
  );
};

// ── Tab: Room Reviews ─────────────────────────────────────
const RoomReviewTab = ({ token, onNewReview }) => {
  const { t } = useI18n();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    axios.get(API + "/rooms/public").then((res) => {
      if (Array.isArray(res.data)) setRooms(res.data);
    }).catch(() => {});
  }, []);

  const fetchRoomReviews = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingReviews(true);
    try {
      const res = await axios.get(API + "/reviews?reviewType=room&roomId=" + roomId);
      setReviews(res.data);
    } catch { /* silent */ }
    finally { setLoadingReviews(false); }
  }, []);

  const handleRoomChange = (e) => {
    setSelectedRoom(e.target.value);
    setReviews([]);
    fetchRoomReviews(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token)        { setError(t("review.errorLogin")); return; }
    if (!selectedRoom) { setError("Please select a room first."); return; }
    if (!rating)       { setError("Please select a rating."); return; }
    setSubmitting(true); setError("");
    try {
      await axios.post(
        API + "/reviews",
        { reviewType: "room", roomId: parseInt(selectedRoom), rating, comment },
        { headers: { Authorization: "Bearer " + token } },
      );
      setSuccess(t("review.success"));
      setRating(0); setComment("");
      setTimeout(() => { setSuccess(""); fetchRoomReviews(selectedRoom); onNewReview && onNewReview(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t("review.errorLogin"));
    } finally { setSubmitting(false); }
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="rp-tab-content">
      <div className="rp-form-card">
        <h3 className="rp-form-title">🛏 Rate a Room</h3>
        <div className="rp-field">
          <label className="rp-label">Select Room <span className="rp-required">*</span></label>
          <select className="rp-select" value={selectedRoom} onChange={handleRoomChange}>
            <option value="">— Choose a room —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>Room {r.roomNumber} — {r.roomType?.name || ""}</option>
            ))}
          </select>
        </div>
        {selectedRoom && avg && (
          <div className="rp-room-mini-summary">
            <StarRow value={Math.round(parseFloat(avg))} readonly size="sm" />
            <span className="rp-room-avg">{avg} / 5</span>
            <span className="rp-room-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="rp-form">
          <div className="rp-field">
            <label className="rp-label">Your Rating <span className="rp-required">*</span></label>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <div className="rp-field">
            <label className="rp-label">Your Comment</label>
            <textarea className="rp-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the comfort, cleanliness, and amenities of this room?" rows={4} />
          </div>
          {error   && <p className="rp-error">{error}</p>}
          {success && <p className="rp-success">{success}</p>}
          <button type="submit" className="rp-submit-btn" disabled={submitting || !selectedRoom}>
            {submitting ? t("review.submitting") : t("review.submit")}
          </button>
        </form>
      </div>
      {selectedRoom && <ReviewList reviews={reviews} loading={loadingReviews} emptyMsg="No reviews for this room yet." />}
    </div>
  );
};

// ── Tab: Service Reviews ──────────────────────────────────
const ServiceReviewTab = ({ token, onNewReview }) => {
  const { t } = useI18n();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    api.get("/services").then((res) => {
      if (Array.isArray(res.data)) setServices(res.data.filter((s) => s.status === "active"));
    }).catch(() => {});
  }, []);

  const fetchServiceReviews = useCallback(async (serviceId) => {
    if (!serviceId) return;
    setLoadingReviews(true);
    try {
      const res = await axios.get(API + "/reviews?reviewType=service&serviceId=" + serviceId);
      setReviews(res.data);
    } catch { /* silent */ }
    finally { setLoadingReviews(false); }
  }, []);

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
    setReviews([]);
    fetchServiceReviews(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token)           { setError(t("review.errorLogin")); return; }
    if (!selectedService) { setError("Please select a service first."); return; }
    if (!rating)          { setError("Please select a rating."); return; }
    setSubmitting(true); setError("");
    try {
      await axios.post(
        API + "/reviews",
        { reviewType: "service", serviceId: parseInt(selectedService), rating, comment },
        { headers: { Authorization: "Bearer " + token } },
      );
      setSuccess(t("review.success"));
      setRating(0); setComment("");
      setTimeout(() => { 
        setSuccess(""); 
        fetchServiceReviews(selectedService); 
        onNewReview && onNewReview();
        // Reset so customer can review another service
        setSelectedService("");
        setReviews([]);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || t("review.errorLogin"));
    } finally { setSubmitting(false); }
  };

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const selectedSvc = services.find((s) => String(s.id) === String(selectedService));

  return (
    <div className="rp-tab-content">
      <div className="rp-form-card">
        <h3 className="rp-form-title">🛎️ Rate a Hotel Service</h3>
        <div className="rp-field">
          <label className="rp-label">Select Service <span className="rp-required">*</span></label>
          <select className="rp-select" value={selectedService} onChange={handleServiceChange}>
            <option value="">— Choose a service —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.icon || ""} {s.name} ({s.category})</option>
            ))}
          </select>
        </div>
        {selectedSvc && (
          <div className="rp-service-info">
            <span className="rp-service-icon">{selectedSvc.icon || "🏨"}</span>
            <div>
              <div className="rp-service-name">{selectedSvc.name}</div>
              {selectedSvc.description && <div className="rp-service-desc">{selectedSvc.description}</div>}
            </div>
          </div>
        )}
        {selectedService && avg && (
          <div className="rp-room-mini-summary">
            <StarRow value={Math.round(parseFloat(avg))} readonly size="sm" />
            <span className="rp-room-avg">{avg} / 5</span>
            <span className="rp-room-count">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="rp-form">
          <div className="rp-field">
            <label className="rp-label">Your Rating <span className="rp-required">*</span></label>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <div className="rp-field">
            <label className="rp-label">Your Comment</label>
            <textarea className="rp-textarea" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this service…" rows={4} />
          </div>
          {error   && <p className="rp-error">{error}</p>}
          {success && <p className="rp-success">{success}</p>}
          <button type="submit" className="rp-submit-btn" disabled={submitting || !selectedService}>
            {submitting ? t("review.submitting") : t("review.submit")}
          </button>
        </form>
      </div>
      {selectedService && <ReviewList reviews={reviews} loading={loadingReviews} emptyMsg="No reviews for this service yet." />}
    </div>
  );
};

// ── Shared: Reviews List ──────────────────────────────────
const ReviewList = ({ reviews, loading, emptyMsg = "No reviews yet." }) => {
  if (loading) return <div className="rp-reviews-loading">Loading reviews…</div>;
  if (!reviews.length) return <p className="rp-no-reviews">{emptyMsg}</p>;
  return (
    <div className="rp-reviews-list">
      <h4 className="rp-reviews-list-title">
        Recent Reviews
        <span className="rp-reviews-count-badge">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
      </h4>
      {reviews.map((r) => (
        <div key={r.id} className="rp-review-item">
          <div className="rp-review-header">
            <span className="rp-reviewer-name">{r.user?.name || "Guest"}</span>
            <StarRow value={r.rating} readonly size="sm" />
            <span className="rp-review-date">
              {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          {r.comment && <p className="rp-review-comment">{r.comment}</p>}
          {(r.cleanlinessRating || r.staffRating || r.locationRating || r.valueRating) && (
            <div className="rp-review-sub">
              {r.cleanlinessRating && <span>🧹 {r.cleanlinessRating}/5</span>}
              {r.staffRating       && <span>👋 {r.staffRating}/5</span>}
              {r.locationRating    && <span>📍 {r.locationRating}/5</span>}
              {r.valueRating       && <span>💰 {r.valueRating}/5</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Overall Summary Banner ────────────────────────────────
const OverallBanner = () => {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    axios.get(API + "/reviews/summary").then((r) => setSummary(r.data)).catch(() => {});
  }, []);
  if (!summary || !summary.overall.count) return null;
  return (
    <div className="rp-banner">
      <div className="rp-banner-score">
        <span className="rp-banner-num">{summary.overall.averageRating}</span>
        <StarRow value={Math.round(summary.overall.averageRating || 0)} readonly size="md" />
        <span className="rp-banner-label">
          <strong>{summary.overall.count}</strong> {summary.overall.count === 1 ? "guest review" : "guest reviews"}
        </span>
      </div>
      <div className="rp-banner-breakdown">
        <div className="rp-banner-type"><span className="rp-banner-type-icon">🏨</span><span className="rp-banner-type-label">Hotel</span><span className="rp-banner-type-val">{summary.hotel.averageRating ? summary.hotel.averageRating + " ★" : "—"}</span></div>
        <div className="rp-banner-type"><span className="rp-banner-type-icon">🛏</span><span className="rp-banner-type-label">Rooms</span><span className="rp-banner-type-val">{summary.room.averageRating ? summary.room.averageRating + " ★" : "—"}</span></div>
        <div className="rp-banner-type"><span className="rp-banner-type-icon">🛎️</span><span className="rp-banner-type-label">Services</span><span className="rp-banner-type-val">{summary.service.averageRating ? summary.service.averageRating + " ★" : "—"}</span></div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const TABS = [
  { id: "hotel",   label: "🏨 Hotel" },
  { id: "room",    label: "🛏 Rooms" },
  { id: "service", label: "🛎️ Services" },
];

const ReviewPage = () => {
  const [activeTab, setActiveTab] = useState("hotel");
  const [summaryKey, setSummaryKey] = useState(0);
  const token = localStorage.getItem("customerToken");
  const handleNewReview = () => setSummaryKey((k) => k + 1);

  return (
    <div className="rp-page">
      <div className="rp-hero">
        <div className="rp-hero-overlay">
          <h1 className="rp-hero-title">⭐ Guest Reviews</h1>
          <p className="rp-hero-sub">Share your experience and help future guests</p>
        </div>
      </div>
      <div className="rp-container">
        <OverallBanner key={summaryKey} />
        {!token && (
          <div className="rp-login-notice">
            💡 <a href="/login">Log in</a> to submit your own review
          </div>
        )}
        <div className="rp-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={"rp-tab" + (activeTab === tab.id ? " rp-tab--active" : "")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "hotel"   && <HotelReviewTab   token={token} onNewReview={handleNewReview} />}
        {activeTab === "room"    && <RoomReviewTab     token={token} onNewReview={handleNewReview} />}
        {activeTab === "service" && <ServiceReviewTab  token={token} onNewReview={handleNewReview} />}
      </div>
      <FAQAndLocation />
      <FooterBar />
    </div>
  );
};

export default ReviewPage;
