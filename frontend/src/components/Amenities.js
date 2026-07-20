import React from "react";
import { useI18n } from "../LanguageContext";

const AMENITY_KEYS = [
  {
    key: "pool",
    icon: "🏊",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80",
  },
  {
    key: "spa",
    icon: "💆",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
  },
  {
    key: "gym",
    icon: "🏋️",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80",
  },
  {
    key: "dining",
    icon: "🍽️",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  },
  {
    key: "bar",
    icon: "🍸",
    image:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
  },
  {
    key: "parking",
    icon: "🅿️",
    image:
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80",
  },
  {
    key: "wifi",
    icon: "📶",
    image:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
  },
  {
    key: "pet",
    icon: "🐕",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  },
  {
    key: "concierge",
    icon: "🏪",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
  },
  {
    key: "business",
    icon: "💼",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
  },
  {
    key: "garden",
    icon: "🌿",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
  },
  {
    key: "shuttle",
    icon: "🚗",
    image:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80",
  },
];

const Amenities = () => {
  const { t } = useI18n();

  return (
    <>
      <div className="what-we-offer">
        <div className="wwo-header">
          <h2>{t("amenities.title")}</h2>
          <p>{t("amenities.subtitle")}</p>
        </div>

        <div className="wwo-grid wwo-grid--wrap">
          {AMENITY_KEYS.map((a) => (
            <div key={a.key} className="wwo-card">
              <div className="wwo-img">
                <img src={a.image} alt={t(`amenities.${a.key}.title`)} />
                <span className="wwo-icon">{a.icon}</span>
              </div>
              <h4>{t(`amenities.${a.key}.title`)}</h4>
              <p>{t(`amenities.${a.key}.desc`)}</p>
            </div>
          ))}
        </div>

        <div className="amenities-footer">
          <p>{t("amenities.footerNote1")}</p>
          <p>{t("amenities.footerNote2")}</p>
        </div>
      </div>
    </>
  );
};

export default Amenities;
