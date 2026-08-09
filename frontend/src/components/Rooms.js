import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import AvailabilitySearch from "./AvailabilitySearch";
import RoomSlideshow from "./RoomSlideshow";
import { FAQAndLocation, FooterBar } from "./Footer";
import { useCurrency, convertPrice } from "../CurrencyContext";
import { useI18n } from "../LanguageContext";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const { currency, rates } = useCurrency();
  const { t } = useI18n();

  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get("/rooms/public");
      setRooms(response.data);
    } catch (err) {
      setError(t("rooms.error"));
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    try {
      const parsed =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof amenities === "string"
        ? amenities.split(",").map((a) => a.trim())
        : [];
    }
  };

  const statusLabel = (status) => {
    const key = `roomStatus.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  const statusStyle = (status) => {
    if (status === "available") return { color: "#2e7d32", bg: "#e8f5e9" };
    if (status === "occupied") return { color: "#b71c1c", bg: "#ffebee" };
    if (status === "maintenance") return { color: "#e65100", bg: "#fff3e0" };
    return { color: "#2e7d32", bg: "#e8f5e9" };
  };

  const FILTERS = [
    { key: "all", label: () => `${t("rooms.filterAll")} (${rooms.length})` },
    {
      key: "available",
      label: () =>
        `${t("rooms.filterAvailable")} (${rooms.filter((r) => r.status === "available").length})`,
    },
    {
      key: "occupied",
      label: () =>
        `${t("rooms.filterOccupied")} (${rooms.filter((r) => r.status === "occupied").length})`,
    },
    {
      key: "maintenance",
      label: () =>
        `${t("rooms.filterMaintenance")} (${rooms.filter((r) => r.status === "maintenance").length})`,
    },
  ];

  const filtered =
    filter === "all" ? rooms : rooms.filter((r) => r.status === filter);

  if (loading)
    return (
      <div className="rooms-container">
        <div className="rooms-header">
          <h2>{t("rooms.title")}</h2>
        </div>
        <div className="rooms-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line--medium" />
                <div className="skeleton-line skeleton-line--full" />
                <div className="skeleton-line skeleton-line--full" />
                <div className="skeleton-line skeleton-line--short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="rooms-container">
        <div className="page-loading" style={{ flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: '2.5rem' }}>😕</span>
          <p style={{ color: '#c0392b', fontWeight: 600 }}>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => { setError(""); setLoading(true); fetchRooms(); }}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#c9a84c,#e2c97e)', color: '#1a1a2e', fontWeight: 700, cursor: 'pointer' }}
          >
            {t("services.retry")}
          </button>
        </div>
      </div>
    );

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h2>{t("rooms.title")}</h2>
        <p>
          {t("rooms.subtitle")} {rooms.length} {t("rooms.subtitleSuffix")}
        </p>
      </div>

      <div className="rooms-search-bar">
        <AvailabilitySearch />
      </div>

      <div className="rooms-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label()}
          </button>
        ))}
      </div>

      <div className="rooms-grid">
        {filtered.map((room) => {
          const sInfo = statusStyle(room.status);
          const amenities = parseAmenities(room.amenities);
          const price = room.roomType?.basePrice;
          const typeName = room.roomType?.name || t("featured.roomFallback");

          return (
            <div key={room.id} className="room-card">
              <div className="room-image">
                <RoomSlideshow
                  images={(() => {
                    try {
                      return JSON.parse(room.images || "[]");
                    } catch {
                      return [];
                    }
                  })()}
                  image={room.image}
                  roomIndex={room.id}
                  alt={`${t("featured.roomLabel")} ${room.roomNumber}`}
                />
                {price && (
                  <div className="room-price-badge">
                    {convertPrice(price, currency, rates)}
                    {t("rooms.priceNight")}
                  </div>
                )}
                {room.status !== "available" && (
                  <span
                    className="room-status-badge"
                    style={{ background: sInfo.bg, color: sInfo.color }}
                  >
                    {statusLabel(room.status)}
                  </span>
                )}
              </div>

              <div className="room-details">
                <h3 className="room-type-name">{typeName}</h3>
                {room.roomType?.description && (
                  <p className="room-description">
                    {room.roomType.description}
                  </p>
                )}
                {amenities.length > 0 && (
                  <div className="room-amenities">
                    {amenities.slice(0, 3).map((a, i) => (
                      <span key={i} className="amenity-tag">
                        {a}
                      </span>
                    ))}
                    {amenities.length > 3 && (
                      <span className="amenity-tag">
                        +{amenities.length - 3} {t("common.more")}
                      </span>
                    )}
                  </div>
                )}
                <div className="room-footer">
                  <span className="room-guests">
                    {t("rooms.upToGuests")} {room.roomType?.capacity || 2}{" "}
                    {t("rooms.guests")}
                  </span>
                  <div className="room-footer-buttons">
                    {room.status === "available" ? (
                      <Link to="/booking" className="book-room-btn">
                        {t("nav.bookNow")}
                      </Link>
                    ) : (
                      <button className="book-room-btn disabled" disabled>
                        {statusLabel(room.status)}
                      </button>
                    )}
                    <Link
                      to={`/reviews/${room.id}?roomId=${room.id}`}
                      className="review-room-btn"
                    >
                      ⭐ {t("rooms.writeReview")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="no-rooms">
          <p>
            {t("rooms.noRooms")} {filter !== "all" ? statusLabel(filter) : ""}{" "}
            {t("rooms.noRoomsSuffix")}
          </p>
        </div>
      )}

      <FAQAndLocation />
      <FooterBar />
    </div>
  );
};

export default Rooms;
