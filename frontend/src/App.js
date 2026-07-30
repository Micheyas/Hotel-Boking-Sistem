import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import BookingForm from "./components/BookingForm";
import AdminPanel from "./components/AdminPanel";
import PaymentForm from "./components/PaymentForm";
import ReviewPage from "./components/ReviewPage";
import VerifyEmailPage from "./components/VerifyEmailPage";
import CustomerAuth, { getCustomerUser, logoutCustomer } from "./components/CustomerAuth";
import ProfileSetup from "./components/ProfileSetup";
import Rooms from "./components/Rooms";
import Amenities from "./components/Amenities";
import AvailabilitySearch from "./components/AvailabilitySearch";
import RoomSlideshow from "./components/RoomSlideshow";
import Services from "./components/Services";
import { FAQAndLocation, FooterBar } from "./components/Footer";
import {
  CurrencyProvider,
  useCurrency,
  CURRENCIES,
  convertPrice,
} from "./CurrencyContext";
import { LanguageProvider, useI18n } from "./LanguageContext";

function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <Router>
          <AppInner />
        </Router>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

function AppInner() {
  const { currency, setCurrency, isLiveRate, ratesLoading } = useCurrency();
  const { language, toggleLanguage, t } = useI18n();
  const activeCurrency =
    CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const languageButtonLabel =
    language === "en" ? t("language.amharic") : t("language.english");
  const languageButtonTitle =
    language === "en"
      ? t("language.switchToAmharic")
      : t("language.switchToEnglish");

  // Customer auth state — re-evaluated on every render so nav stays in sync
  const [customerUser, setCustomerUser] = React.useState(getCustomerUser());
  React.useEffect(() => {
    const sync = () => setCustomerUser(getCustomerUser());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const handleCustomerLogout = () => {
    logoutCustomer();
    setCustomerUser(null);
    window.location.href = "/";
  };

  return (
    <div className="App">
      <header className="navbar">
        <Link to="/" className="navbar-logo">
          2RN Solomon
        </Link>
        <nav className="navbar-links">
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/rooms">{t("nav.rooms")}</Link>
          <Link to="/services">🛎️ {t("nav.services")}</Link>
          <Link to="/amenities">{t("nav.amenities")}</Link>
          <Link to="/reviews">⭐ {t("nav.reviews")}</Link>
          <Link to="/admin" className="navbar-staff">
            🔑 {t("nav.staff")}
          </Link>
          <div className="navbar-currency">
            <span>{activeCurrency.flag}</span>
            <select
              value={activeCurrency.code}
              onChange={(e) => setCurrency(e.target.value)}
              className="navbar-currency-select"
              aria-label="Select currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span
              title={
                ratesLoading
                  ? t("currency.loadingRates")
                  : isLiveRate
                    ? t("currency.liveRates")
                    : t("currency.estimatedRates")
              }
              style={{ cursor: "default", fontSize: "0.7rem" }}
            >
              {ratesLoading ? "⏳" : isLiveRate ? "🟢" : "🟡"}
            </span>
          </div>
          <button
            type="button"
            className="navbar-language-link"
            onClick={toggleLanguage}
            title={languageButtonTitle}
            aria-label={languageButtonTitle}
          >
            {languageButtonLabel}
          </button>
          {customerUser ? (
            <div className="navbar-customer-menu">
              <span className="navbar-customer-name">
                👤 {customerUser.name.split(" ")[0]}
                {customerUser.emailVerified
                  ? <span className="navbar-verified-badge" title="Email verified">✅</span>
                  : <span className="navbar-unverified-badge" title="Email not verified">⚠️</span>}
              </span>
              {customerUser.kycStatus === 'pending' || customerUser.kycStatus === 'rejected' ? (
                <Link to="/profile-setup" className="navbar-book-btn" style={{background:'linear-gradient(135deg,#c53030,#9b2c2c)'}}>
                  🪪 Verify Identity
                </Link>
              ) : customerUser.kycStatus === 'submitted' ? (
                <span className="navbar-customer-name" style={{fontSize:'0.78rem',color:'#e2c97e'}}>⏳ KYC Under Review</span>
              ) : (
                <Link to="/booking" className="navbar-book-btn">
                  {t("nav.bookNow")}
                </Link>
              )}
              <button
                className="navbar-logout-btn"
                onClick={handleCustomerLogout}
                title="Log out"
              >
                ↪ Logout
              </button>
            </div>
          ) : (
            <div className="navbar-customer-menu">
              <Link to="/login" className="navbar-login-btn">
                Login
              </Link>
              <Link to="/register" className="navbar-book-btn">
                Register &amp; Book
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/services" element={<Services />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<CustomerAuth />} />
          <Route path="/register" element={<CustomerAuth />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/payment" element={<PaymentForm />} />
          <Route
            path="/reviews/:roomId"
            element={<ReviewPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

function FeaturedRooms() {
  const [rooms, setRooms] = React.useState([]);
  const { currency, rates } = useCurrency();
  const { t } = useI18n();

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/rooms/public`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const seen = new Map();
        for (const room of data) {
          const typeId = room.roomTypeId;
          if (!seen.has(typeId)) {
            seen.set(typeId, room);
          } else {
            const existing = seen.get(typeId);
            const existingHasImg =
              existing.image || (existing.images && existing.images !== "[]");
            const newHasImg =
              room.image || (room.images && room.images !== "[]");
            if (!existingHasImg && newHasImg) seen.set(typeId, room);
          }
        }
        setRooms([...seen.values()]);
      })
      .catch(() => {});
  }, []);

  if (rooms.length === 0) return null;

  const parseAmenities = (a) => {
    if (!a) return [];
    try {
      const p = typeof a === "string" ? JSON.parse(a) : a;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  };

  const getRoomStatusLabel = (status) => {
    const translated = t(`roomStatus.${status}`);
    return translated === `roomStatus.${status}` ? status : translated;
  };

  return (
    <div className="featured-rooms-section">
      <div className="featured-rooms-header">
        <h2>{t("featured.title")}</h2>
        <p>{t("featured.subtitle")}</p>
        <a href="/rooms" className="view-all-btn">
          {t("featured.viewAll")}
        </a>
      </div>
      <div className="featured-rooms-grid">
        {rooms.map((room) => {
          let imageList = [];
          try {
            imageList = JSON.parse(room.images || "[]");
          } catch {
            imageList = [];
          }
          if (imageList.length === 0 && room.image) imageList = [room.image];
          const amenities = parseAmenities(room.amenities);
          const isAvailable = room.status === "available";
          return (
            <div key={room.id} className="featured-room-card">
              <div className="featured-room-img">
                <RoomSlideshow
                  images={imageList}
                  image={room.image}
                  roomIndex={room.id}
                  alt={`${t("featured.roomLabel")} ${room.roomNumber}`}
                  interval={5000}
                />
                <span className={`fr-status ${room.status}`}>
                  {isAvailable
                    ? t("featured.available")
                    : getRoomStatusLabel(room.status)}
                </span>
              </div>
              <div className="featured-room-info">
                <div className="fr-title-row">
                  <h3>{room.roomType?.name || t("featured.roomFallback")}</h3>
                  <span className="fr-type">
                    {t("featured.roomLabel")} {room.roomNumber}
                  </span>
                </div>
                <p className="fr-desc">{room.roomType?.description || ""}</p>
                {amenities.length > 0 && (
                  <div className="fr-amenities">
                    {amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="amenity-tag">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                <div className="fr-footer">
                  <span className="fr-price">
                    {convertPrice(
                      room.roomType?.basePrice || 0,
                      currency,
                      rates,
                    )}
                    <span>{t("featured.perNight")}</span>
                  </span>
                  {isAvailable ? (
                    <a href="/booking" className="fr-book-btn">
                      {t("nav.bookNow")}
                    </a>
                  ) : (
                    <span className="fr-unavailable">
                      {t("featured.unavailable")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const { t } = useI18n();

  // Live review summary for hero
  const [heroRating, setHeroRating] = React.useState(null);
  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/reviews/summary`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.overall?.count > 0) {
          setHeroRating({
            avg: data.overall.averageRating,
            count: data.overall.count,
          });
        }
      })
      .catch(() => {});
  }, []);
  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=80",
      caption: t("gallery.grandLobby"),
    },
    {
      url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=80",
      caption: t("gallery.diningArea"),
    },
    {
      url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=80",
      caption: t("gallery.spaWellness"),
    },
    {
      url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&q=80",
      caption: t("gallery.rooftopBar"),
    },
  ];

  return (
    <div className="home">
      <div className="hero">
        <div className="slideshow-container">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className="slide"
              style={{ animationDelay: `${i * 5}s` }}
            >
              <img src={img.url} alt={img.caption} className="slide-image" />
            </div>
          ))}
        </div>
        <div className="hero-overlay">
          <div className="hero-text">
            {heroRating ? (
              <a href="/reviews" className="hero-rating-badge" aria-label="View guest reviews">
                <span className="hero-rating-stars">
                  {"★".repeat(Math.round(heroRating.avg))}{"☆".repeat(5 - Math.round(heroRating.avg))}
                </span>
                <span className="hero-rating-score">{heroRating.avg}</span>
              </a>
            ) : (
              <div className="hero-stars">⭐⭐⭐⭐⭐</div>
            )}
            <h1 className="hero-title">{t("home.heroTitle")}</h1>
            <p className="hero-subtitle">{t("home.heroSubtitle")}</p>
          </div>

          <div className="hero-search-card">
            <AvailabilitySearch />
          </div>
        </div>
      </div>

      <FeaturedRooms />

      <div className="what-we-offer">
        <div className="wwo-header">
          <h2>{t("offer.title")}</h2>
          <p>{t("offer.subtitle")}</p>
        </div>
        <div className="wwo-grid">
          <div className="wwo-card">
            <div className="wwo-img">
              <img
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80"
                alt={t("offer.wifiTitle")}
              />
              <span className="wwo-icon">📶</span>
            </div>
            <h4>{t("offer.wifiTitle")}</h4>
            <p>{t("offer.wifiText")}</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80"
                alt={t("offer.spaTitle")}
              />
              <span className="wwo-icon">🤍</span>
            </div>
            <h4>{t("offer.spaTitle")}</h4>
            <p>{t("offer.spaText")}</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80"
                alt={t("offer.gymTitle")}
              />
              <span className="wwo-icon">🏋️</span>
            </div>
            <h4>{t("offer.gymTitle")}</h4>
            <p>{t("offer.gymText")}</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80"
                alt={t("offer.skyBarTitle")}
              />
              <span className="wwo-icon">🍸</span>
            </div>
            <h4>{t("offer.skyBarTitle")}</h4>
            <p>{t("offer.skyBarText")}</p>
          </div>
          <div className="wwo-card">
            <div className="wwo-img">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80"
                alt={t("offer.diningTitle")}
              />
              <span className="wwo-icon">🍽️</span>
            </div>
            <h4>{t("offer.diningTitle")}</h4>
            <p>{t("offer.diningText")}</p>
          </div>
        </div>
      </div>

      <Amenities />

      <FAQAndLocation />
      <FooterBar />
    </div>
  );
}

export default App;
