import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Inline FAQ (accordion) ── */
const FAQS = [
  { q: 'What are the check-in and check-out times?',   a: 'Check-in starts at 3:00 PM and check-out is until 12:00 PM. Early check-in and late check-out are available upon request.' },
  { q: 'Is breakfast included with the room?',          a: 'Breakfast is included with Deluxe and Suite bookings. Standard rooms can add breakfast for ETB 500 per person.' },
  { q: 'What is your cancellation policy?',             a: 'Free cancellation up to 48 hours before check-in. Cancellations within 48 hours incur one night\'s charge.' },
  { q: 'Do you have a pool and spa?',                   a: 'Yes! Our rooftop infinity pool and full-service spa are open daily 7 AM – 10 PM for hotel guests.' },
  { q: 'Is WiFi available?',                            a: 'Complimentary high-speed gigabit WiFi is available throughout the hotel and all guest rooms.' },
  { q: 'Do you offer airport transportation?',          a: 'We offer complimentary shuttle service. Advance booking required at least 24 hours prior.' },
  { q: 'How can I contact the hotel?',                  a: 'Call us at +251 11 234 5678 or email info@2rnsolomon.com. Our 24-hour front desk is always available.' },
];

const FAQSection = () => {
  const [open, setOpen] = useState(null);
  return (
    <div className="page-faq">
      <div className="page-faq-header">
        <h2>Frequently Asked Questions</h2>
        <p>Everything you need to know before your stay</p>
      </div>
      <div className="page-faq-list">
        {FAQS.map((f, i) => (
          <div key={i} className={`page-faq-item ${open === i ? 'open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
            <div className="page-faq-q">
              <span>{f.q}</span>
              <span className="page-faq-toggle">{open === i ? '−' : '+'}</span>
            </div>
            {open === i && <div className="page-faq-a"><p>{f.a}</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Location / Map ── */
const LocationSection = () => (
  <div className="page-location">
    <div className="page-location-info">
      <h2>Find Us</h2>
      <p className="page-location-address">📍 Bole Road, Addis Ababa, Ethiopia</p>
      <div className="page-location-details">
        <div className="page-loc-item"><span>📞</span><span>+251 11 234 5678</span></div>
        <div className="page-loc-item"><span>✉️</span><span>info@2rnsolomon.com</span></div>
        <div className="page-loc-item"><span>🕐</span><span>24/7 Front Desk</span></div>
        <div className="page-loc-item"><span>🚗</span><span>10 min from Bole Airport</span></div>
      </div>
      <Link to="/booking" className="page-loc-btn">Book Your Stay</Link>
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

/* ── Footer ── */
const FooterBar = () => (
  <footer className="site-footer">
    <div className="site-footer-top">
      <div className="sf-brand">
        <h3>2RN Solomon</h3>
        <p>Where Luxury Meets Tranquility</p>
        <p className="sf-address">Bole Road, Addis Ababa, Ethiopia</p>
      </div>
      <div className="sf-links-group">
        <h4>Quick Links</h4>
        <Link to="/">Home</Link>
        <Link to="/rooms">Rooms</Link>
        <Link to="/amenities">Amenities</Link>
        <Link to="/booking">Book Now</Link>
      </div>
      <div className="sf-links-group">
        <h4>Services</h4>
        <span>Rooftop Pool</span>
        <span>Full-Service Spa</span>
        <span>Fine Dining</span>
        <span>Airport Shuttle</span>
      </div>
      <div className="sf-links-group">
        <h4>Contact</h4>
        <span>📞 +251 11 234 5678</span>
        <span>✉️ info@2rnsolomon.com</span>
        <span>🕐 24/7 Front Desk</span>
        <Link to="/admin" className="sf-staff-link">🔑 Staff Portal</Link>
      </div>
    </div>
    <div className="site-footer-bottom">
      <p>© {new Date().getFullYear()} 2RN Solomon Hotel. All rights reserved.</p>
    </div>
  </footer>
);

/* ── Combined export ── */
export { FAQSection, LocationSection, FooterBar };

/* ── Side-by-side FAQ + Location ── */
export const FAQAndLocation = () => (
  <div className="faq-location-row">
    <div className="faq-location-faq"><FAQSection /></div>
    <div className="faq-location-map"><LocationSection /></div>
  </div>
);

export default FooterBar;
