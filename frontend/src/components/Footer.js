import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../LanguageContext";

/* ── Inline FAQ (accordion) ── */
const FAQSection = () => {
  const [open, setOpen] = useState(null);
  const { t } = useI18n();

  const FAQS = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
  ];

  return (
    <div className="page-faq">
      <div className="page-faq-header">
        <h2>{t("faq.title")}</h2>
        <p>{t("faq.subtitle")}</p>
      </div>
      <div className="page-faq-list">
        {FAQS.map((f, i) => (
          <div
            key={i}
            className={`page-faq-item ${open === i ? "open" : ""}`}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <div className="page-faq-q">
              <span>{f.q}</span>
              <span className="page-faq-toggle">{open === i ? "−" : "+"}</span>
            </div>
            {open === i && (
              <div className="page-faq-a">
                <p>{f.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Location / Map ── */
const LocationSection = () => {
  const { t } = useI18n();
  return (
    <div className="page-location">
      <div className="page-location-info">
        <h2>{t("location.title")}</h2>
        <p className="page-location-address">{t("location.address")}</p>
        <div className="page-location-details">
          <div className="page-loc-item">
            <span>📞</span>
            <span>+251 995 111 015</span>
          </div>
          <div className="page-loc-item">
            <span>📱</span>
            <span>+251 706 104 273</span>
          </div>
          <div className="page-loc-item">
            <span>✉️</span>
            <span>info@2rnsolomon.com</span>
          </div>
          <div className="page-loc-item">
            <span>🕐</span>
            <span>{t("location.frontDesk")}</span>
          </div>
          <div className="page-loc-item">
            <span>🚗</span>
            <span>{t("location.airport")}</span>
          </div>
        </div>
        <Link to="/booking" className="page-loc-btn">
          {t("location.bookStay")}
        </Link>
      </div>
      <div className="page-location-map">
        <iframe
          title="Hotel Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5!2d38.7636!3d9.0107!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDAnMzguNSJOIDM4wrA0NSc0OS4wIkU!5e0!3m2!1sen!2set!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
};

/* ── Footer ── */
const FooterBar = () => {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="sf-brand">
          <h3>2RN Solomon</h3>
          <p>{t("footer.tagline")}</p>
          <p className="sf-address">{t("location.address")}</p>
        </div>
        <div className="sf-links-group">
          <h4>{t("footer.quickLinks")}</h4>
          <Link to="/">{t("nav.home")}</Link>
          <Link to="/rooms">{t("nav.rooms")}</Link>
          <Link to="/amenities">{t("nav.amenities")}</Link>
          <Link to="/booking">{t("nav.bookNow")}</Link>
        </div>
        <div className="sf-links-group">
          <h4>{t("footer.services")}</h4>
          <span>{t("footer.pool")}</span>
          <span>{t("footer.spa")}</span>
          <span>{t("footer.dining")}</span>
          <span>{t("footer.shuttle")}</span>
        </div>
        <div className="sf-links-group">
          <h4>{t("footer.contact")}</h4>
          <span>📞 +251 995 111 015</span>
          <span>📱 +251 706 104 273</span>
          <span>✉️ info@2rnsolomon.com</span>
          <span>🕐 {t("location.frontDesk")}</span>
          <Link to="/admin" className="sf-staff-link">
            {t("footer.staffPortal")}
          </Link>
        </div>
      </div>
      <div className="site-footer-bottom">
        <p>{t("footer.copyright")}</p>
      </div>
    </footer>
  );
};

/* ── Combined export ── */
export { FAQSection, LocationSection, FooterBar };

/* ── Side-by-side FAQ + Location ── */
export const FAQAndLocation = () => (
  <div className="faq-location-row">
    <div className="faq-location-faq">
      <FAQSection />
    </div>
    <div className="faq-location-map">
      <LocationSection />
    </div>
  </div>
);

export default FooterBar;
