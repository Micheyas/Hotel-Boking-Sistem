import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api";
import RoomSlideshow from "./RoomSlideshow";
import { useCurrency, convertPrice as ctxConvert } from "../CurrencyContext";
import { useI18n } from "../LanguageContext";
import {
  getCustomerToken,
  getCustomerUser,
  isCustomerVerified,
  logoutCustomer,
} from "./CustomerAuth";

// Check KYC status from stored user
function getKycStatus() {
  try {
    const u = JSON.parse(localStorage.getItem("customerUser"));
    return u?.kycStatus || "pending";
  } catch { return "pending"; }
}

function convertPrice(etb, currency, rates) {
  return ctxConvert(etb, currency, rates);
}

const FALLBACK_IMAGES = {
  standard: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&q=80",
  deluxe:   "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&q=80",
  suite:    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80",
  executive:"https://images.unsplash.com/photo-1590490360182-c33d57733427?w=700&q=80",
  penthouse:"https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=700&q=80",
  twin:     "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=700&q=80",
  family:   "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=700&q=80",
  default:  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=700&q=80",
};

const DEFAULT_AMENITIES = {
  standard:  ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Work Desk"],
  deluxe:    ["Free WiFi", "Air Conditioning", "Smart TV", "Mini-bar", "City View"],
  suite:     ["Free WiFi", "Air Conditioning", "Smart TV", "Mini-bar", "Jacuzzi", "Private Balcony"],
  executive: ["Free WiFi", "Air Conditioning", "Smart TV", "Mini-bar", "Lounge Access", "Butler Service"],
  penthouse: ["Free WiFi", "Air Conditioning", "Smart TV", "Premium Mini-bar", "Jacuzzi", "Private Balcony", "Butler Service"],
  twin:      ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Work Desk", "Safe Box"],
  family:    ["Free WiFi", "Air Conditioning", "Flat-screen TV", "Room Service", "Safe Box"],
  default:   ["Free WiFi", "Air Conditioning", "Flat-screen TV"],
};

// eslint-disable-next-line no-unused-vars
function getFallbackImage(name = "") {
  const n = name.toLowerCase();
  for (const key of Object.keys(FALLBACK_IMAGES)) {
    if (key !== "default" && n.includes(key)) return FALLBACK_IMAGES[key];
  }
  return FALLBACK_IMAGES.default;
}

function getDefaultAmenities(name = "") {
  const n = name.toLowerCase();
  for (const key of Object.keys(DEFAULT_AMENITIES)) {
    if (key !== "default" && n.includes(key)) return DEFAULT_AMENITIES[key];
  }
  return DEFAULT_AMENITIES.default;
}

const BookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const { currency, rates } = useCurrency();
  const { t } = useI18n();

  const customerToken = getCustomerToken();
  const customerUser  = getCustomerUser();
  const verified      = isCustomerVerified();
  const kycStatus     = getKycStatus();

  // ── ALL hooks declared before any early return ──────────
  const [checkIn,  setCheckIn]  = useState(params.get("checkIn")  || "");
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || "");
  const [adults,   setAdults]   = useState(Number(params.get("adults"))   || 1);
  const [children, setChildren] = useState(Number(params.get("children")) || 0);
  const [results,  setResults]  = useState(null);
  const [searching,setSearching]= useState(false);
  const [searchErr,setSearchErr]= useState("");
  const [selected, setSelected] = useState(null);
  const [guestInfo,setGuestInfo]= useState({
    name:  customerUser ? customerUser.name  : "",
    email: customerUser ? customerUser.email : "",
    phone: "",
  });
  const [booking,      setBooking]      = useState(false);
  const [bookErr,      setBookErr]      = useState("");
  const [bookErrLink,  setBookErrLink]  = useState(false);
  const [loyaltyInfo,  setLoyaltyInfo]  = useState(null);
  const [loyaltyChecking, setLoyaltyChecking] = useState(false);
  const loyaltyTimerRef = React.useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!customerToken || !customerUser) {
      navigate("/login?from=" + encodeURIComponent("/booking" + location.search));
    }
  }, [customerToken, customerUser, navigate, location.search]);

  // Cleanup loyalty timer on unmount
  useEffect(() => {
    return () => {
      if (loyaltyTimerRef.current) clearTimeout(loyaltyTimerRef.current);
    };
  }, []);

  // Auto-search if dates came from URL
  useEffect(() => {
    const ci = params.get("checkIn");
    const co = params.get("checkOut");
    if (ci && co) doSearch(ci, co);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ────────────────────────────────────────────────────────

  // Early returns AFTER all hooks
  if (customerToken && customerUser && !verified) {
    return (
      <div className="booking-form">
        <div className="bfm-verify-wall">
          <div className="bfm-verify-icon">📧</div>
          <h2>Verify Your Email First</h2>
          <p>
            Your account (<strong>{customerUser.email}</strong>) is not verified yet.
            Check your inbox for the verification link we sent when you registered.
          </p>
          <p>Didn't receive it?</p>
          <Link to="/verify-email" className="bfm-verify-btn">
            Resend Verification Email
          </Link>
          <button
            className="bfm-logout-link"
            onClick={() => { logoutCustomer(); navigate("/login"); }}
          >
            ← Log in with a different account
          </button>
        </div>
      </div>
    );
  }

  if (!customerToken || !customerUser) return null;

  // KYC wall — must submit identity documents before booking
  if (kycStatus === "pending") {
    return (
      <div className="booking-form">
        <div className="bfm-verify-wall">
          <div className="bfm-verify-icon">🪪</div>
          <h2>Identity Verification Required</h2>
          <p>You need to verify your identity before making a booking.</p>
          <p>Please submit your personal information and a valid ID document.</p>
          <Link to="/profile-setup" className="bfm-verify-btn">
            Complete Identity Verification
          </Link>
          <button className="bfm-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
            ← Log in with a different account
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === "submitted") {
    return (
      <div className="booking-form">
        <div className="bfm-verify-wall">
          <div className="bfm-verify-icon">⏳</div>
          <h2>Verification Under Review</h2>
          <p>Your documents are being reviewed by our staff.</p>
          <p>You will be able to book once your identity is approved. This usually takes less than 24 hours.</p>
          <Link to="/" className="bfm-verify-btn">Back to Home</Link>
          <button className="bfm-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
            ← Log in with a different account
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === "rejected") {
    return (
      <div className="booking-form">
        <div className="bfm-verify-wall">
          <div className="bfm-verify-icon">❌</div>
          <h2>Verification Rejected</h2>
          <p>Your identity verification was rejected. Please resubmit with valid documents.</p>
          <Link to="/profile-setup" className="bfm-verify-btn">
            Resubmit Documents
          </Link>
          <button className="bfm-logout-link" onClick={() => { logoutCustomer(); navigate("/login"); }}>
            ← Log in with a different account
          </button>
        </div>
      </div>
    );
  }

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const scheduleLoyaltyCheck = (nextInfo) => {
    const name  = nextInfo.name.trim();
    const phone = nextInfo.phone.trim();
    const email = nextInfo.email.trim().toLowerCase();
    setLoyaltyInfo(null);
    setLoyaltyChecking(false);
    if (loyaltyTimerRef.current) clearTimeout(loyaltyTimerRef.current);
    if (!name || !phone) return;
    setLoyaltyChecking(true);
    loyaltyTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(
          "/bookings/check-repeat?name=" + encodeURIComponent(name) +
          "&phone=" + encodeURIComponent(phone) +
          "&email=" + encodeURIComponent(email)
        );
        setLoyaltyInfo(res.data);
      } catch {
        setLoyaltyInfo(null);
      } finally {
        setLoyaltyChecking(false);
      }
    }, 700);
  };

  const handleGuestInfoChange = (field) => (e) => {
    const value = e.target.value;
    setGuestInfo((prev) => {
      const next = { ...prev, [field]: value };
      scheduleLoyaltyCheck(next);
      return next;
    });
  };

  const doSearch = async (ci, co) => {
    setSearchErr(""); setResults(null); setSelected(null);
    if (!ci || !co) { setSearchErr(t("availability.missingDates")); return; }
    if (new Date(co) <= new Date(ci)) { setSearchErr(t("availability.invalidDateRange")); return; }
    setSearching(true);
    try {
      const res = await api.get(
        "/rooms/check-availability?checkIn=" + ci + "&checkOut=" + co +
        "&adults=" + adults + "&children=" + children
      );
      setResults(res.data);
    } catch (err) {
      setSearchErr(err.response?.data?.error || "Failed to check availability.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(checkIn, checkOut);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!guestInfo.phone) { setBookErr(t("booking.fillNamePhone")); return; }
    const discountPercent = loyaltyInfo?.discountPercent || 0;
    const originalTotal = selected.totalPrice;
    setBooking(true); setBookErr("");
    try {
      const res = await api.post(
        "/bookings/guest",
        {
          roomId: selected.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice: originalTotal,
          loyaltyDiscountPercent: discountPercent,
          guestName: customerUser.name,
          guestEmail: customerUser.email,
          guestPhone: guestInfo.phone,
        },
        { headers: { Authorization: "Bearer " + customerToken } }
      );
      const bookingId = res.data?.booking?.id || res.data?.id;
      const bookingAmount = Number(res.data?.booking?.totalPrice || originalTotal);
      navigate("/payment?bookingId=" + bookingId + "&amount=" + bookingAmount);
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.error || "Booking failed. Please try again.";
      if (code === "EMAIL_NOT_VERIFIED") {
        setBookErr("⚠️ " + message);
        setBookErrLink(true);
      } else {
        setBookErr(message);
        setBookErrLink(false);
      }
    } finally {
      setBooking(false);
    }
  };

  // ── Step 3: Guest details ──────────────────────────────
  if (selected) {
    const nights = results?.nights || 1;
    const discountPercent = loyaltyInfo?.discountPercent || 0;
    const originalTotal = selected.totalPrice;
    const discountAmount = Math.round((originalTotal * discountPercent) / 100);
    const finalTotal = originalTotal - discountAmount;
    return (
      <div className="booking-form">
        <button className="back-btn" onClick={() => setSelected(null)}>
          {t("booking.backToResults")}
        </button>
        <h2>{t("booking.title")}</h2>

        <div className="selected-room-summary">
          <h3>{selected.name}</h3>
          <p>{selected.description}</p>
          <div className="summary-row">
            <span>
              📅 {checkIn} → {checkOut} ({nights}{" "}
              {nights > 1 ? t("common.nights") : t("common.night")})
            </span>
          </div>
          <div className="summary-row">
            <span>
              👤 {adults} {adults > 1 ? t("booking.adults") : t("booking.adult")}
              {children > 0
                ? ", " + children + " " + (children > 1 ? t("booking.children") : t("booking.child"))
                : ""}
            </span>
          </div>
          {discountPercent > 0 ? (
            <div className="summary-price">
              <div className="price-row-original">
                <span>{t("common.original")}:</span>
                <span className="price-struck">{convertPrice(originalTotal, currency, rates)}</span>
              </div>
              <div className="price-row-discount">
                <span>{t("common.discount")} ({discountPercent}%):</span>
                <span className="price-saving">− {convertPrice(discountAmount, currency, rates)}</span>
              </div>
              <div className="price-row-final">
                <span>{t("common.total")}:</span>
                <strong className="price-final">{convertPrice(finalTotal, currency, rates)}</strong>
              </div>
            </div>
          ) : (
            <div className="summary-price">
              <span>{t("common.total")}: </span>
              <strong>{convertPrice(selected.totalPrice, currency, rates)}</strong>
            </div>
          )}
        </div>

        {loyaltyChecking && (
          <div className="loyalty-checking">{t("booking.loyaltyChecking")}</div>
        )}

        {loyaltyInfo && loyaltyInfo.isRepeat && (
          <div className="loyalty-banner">
            <div className="loyalty-banner-left">
              <span className="loyalty-icon">🎁</span>
              <div>
                <div className="loyalty-title">{t("booking.loyaltyTitle")}</div>
                <div className="loyalty-sub">
                  {t("booking.loyaltySub")} {loyaltyInfo.bookingCount}{" "}
                  {loyaltyInfo.bookingCount !== 1
                    ? t("booking.loyaltySubSuffixPlural")
                    : t("booking.loyaltySubSuffix")}{" "}
                  {t("booking.loyaltyWithUs")}
                </div>
              </div>
            </div>
            <span className={"loyalty-tier loyalty-tier--" + loyaltyInfo.discountLabel.toLowerCase().replace(" ", "-")}>
              {loyaltyInfo.discountLabel} — {loyaltyInfo.discountPercent}% off
            </span>
          </div>
        )}

        {bookErr && (
          <div className="error" style={{ lineHeight: 1.6 }}>
            {bookErr}
            {bookErrLink && (
              <Link
                to="/verify-email"
                style={{ color: "#0f3460", fontWeight: 700, textDecoration: "underline", marginLeft: 4 }}
              >
                resend verification email
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleBook} className="guest-form">
          <div className="bfm-account-banner">
            <span className="bfm-account-icon">✅</span>
            <div>
              <div className="bfm-account-name">{customerUser.name}</div>
              <div className="bfm-account-email">{customerUser.email} · Verified</div>
            </div>
            <button
              type="button"
              className="bfm-account-logout"
              onClick={() => { logoutCustomer(); navigate("/login"); }}
            >
              Switch account
            </button>
          </div>

          <div className="form-group">
            <label>{t("booking.phone")} <span style={{ color: "#e53e3e" }}>*</span></label>
            <input
              type="tel"
              placeholder={t("booking.phonePlaceholder")}
              value={guestInfo.phone}
              onChange={handleGuestInfoChange("phone")}
              required
            />
          </div>

          <button type="submit" disabled={booking} className="btn btn-primary book-confirm-btn">
            {booking ? t("booking.processing") : t("booking.proceedToPayment")}
          </button>
        </form>
      </div>
    );
  }

  // ── Step 1 + 2: Search & Results ──────────────────────
  return (
    <div className="booking-form">
      <h2>{t("availability.title")}</h2>

      <form onSubmit={handleSearch} className="availability-search inline">
        <div className="search-fields">
          <div className="search-field">
            <label>📅 {t("common.checkIn")}</label>
            <input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} required />
          </div>
          <div className="search-field">
            <label>📅 {t("common.checkOut")}</label>
            <input type="date" value={checkOut} min={checkIn || tomorrow} onChange={(e) => setCheckOut(e.target.value)} required />
          </div>
          <div className="search-field search-field-sm">
            <label>👤 {t("common.adults")}</label>
            <input type="number" min="1" max="6" value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </div>
          <div className="search-field search-field-sm">
            <label>🧒 {t("common.children")}</label>
            <input type="number" min="0" max="4" value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </div>
          <button type="submit" className="search-btn" disabled={searching}>
            {searching ? t("availability.searching") : t("availability.button")}
          </button>
        </div>
        {searchErr && <p className="search-error">{searchErr}</p>}
      </form>

      {results && (
        <div className="availability-results">
          <h3>
            {results.available.length > 0
              ? results.available.length + " " + (results.available.length > 1 ? t("availability.resultsFoundPlural") : t("availability.resultsFound"))
              : t("availability.noRoomsFound")}
          </h3>
          <p className="results-meta">
            {results.checkIn} → {results.checkOut} · {results.nights}{" "}
            {results.nights > 1 ? t("availability.metaPlural") : t("availability.meta")} · {adults}{" "}
            {adults > 1 ? t("booking.adults") : t("booking.adult")}
            {children > 0
              ? ", " + children + " " + (children > 1 ? t("booking.children") : t("booking.child"))
              : ""}
          </p>
          <div className="results-grid">
            {results.available.map((rt) => {
              let amenityList = [];
              if (rt.amenities) {
                try {
                  const parsed = typeof rt.amenities === "string" ? JSON.parse(rt.amenities) : rt.amenities;
                  amenityList = Array.isArray(parsed) ? parsed : [];
                } catch { amenityList = []; }
              }
              if (amenityList.length === 0) amenityList = getDefaultAmenities(rt.name);
              return (
                <div key={rt.id} className="result-card">
                  <div className="result-image">
                    <RoomSlideshow images={rt.images || []} image={rt.image} roomIndex={rt.id} alt={rt.name} />
                    <div className="result-price-badge">
                      {convertPrice(rt.basePrice, currency, rates)}
                      <span>{t("common.perNight")}</span>
                    </div>
                  </div>
                  <div className="result-info">
                    <h4>{rt.name}</h4>
                    <p className="result-desc">{rt.description}</p>
                    <p className="result-floor">{t("availability.floor")} {rt.floor}</p>
                    {amenityList.length > 0 && (
                      <div className="result-amenities">
                        {amenityList.slice(0, 4).map((a, i) => (
                          <span key={i} className="amenity-tag">{a}</span>
                        ))}
                        {amenityList.length > 4 && (
                          <span className="amenity-tag">+{amenityList.length - 4} {t("common.more")}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="result-footer">
                    <div className="result-total">
                      {t("common.total")}:{" "}
                      <strong>{convertPrice(rt.totalPrice, currency, rates)}</strong>
                      <span className="result-nights">
                        {" "}· {rt.nights} {rt.nights > 1 ? t("availability.metaPlural") : t("availability.meta")}
                      </span>
                    </div>
                    <button className="result-select-btn" onClick={() => setSelected(rt)}>
                      {t("availability.selectRoom")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!results && !searching && <p className="search-hint">{t("availability.hint")}</p>}
    </div>
  );
};

export default BookingForm;
