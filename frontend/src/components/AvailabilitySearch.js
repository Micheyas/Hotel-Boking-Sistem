import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../LanguageContext";

const today = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

const AvailabilitySearch = () => {
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError(t("availability.missingDates"));
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError(t("availability.invalidDateRange"));
      return;
    }

    navigate(
      `/booking?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`,
    );
  };

  return (
    <form className="availability-search" onSubmit={handleSearch}>
      <div className="search-fields">
        <div className="search-field">
          <label>📅 {t("common.checkIn")}</label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div className="search-field">
          <label>📅 {t("common.checkOut")}</label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
        <div className="search-field search-field-sm">
          <label>👤 {t("common.adults")}</label>
          <input
            type="number"
            min="1"
            max="6"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
        </div>
        <div className="search-field search-field-sm">
          <label>🧒 {t("common.children")}</label>
          <input
            type="number"
            min="0"
            max="4"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
          />
        </div>
        <button type="submit" className="search-btn">
          {t("availability.button")}
        </button>
      </div>
      {error && <p className="search-error">{error}</p>}
    </form>
  );
};

export default AvailabilitySearch;
