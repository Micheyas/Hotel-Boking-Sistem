import React from 'react';
import { FAQSection, LocationSection, FooterBar, FAQAndLocation } from './Footer';

const amenities = [
  { icon: '🏊', title: 'Rooftop Infinity Pool',  description: 'Heated pool with panoramic city views. Open daily 7 AM – 10 PM.',          image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80' },
  { icon: '💆', title: 'Full-Service Spa',        description: 'Luxury massages, facials, and wellness therapies.',                          image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' },
  { icon: '🏋️', title: '24/7 Fitness Center',    description: 'State-of-the-art gym with Peloton bikes and personal training.',            image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80' },
  { icon: '🍽️', title: 'Fine Dining Restaurant', description: 'Award-winning cuisine with locally sourced ingredients.',                    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80' },
  { icon: '🍸', title: 'Rooftop Bar',             description: 'Craft cocktails and small plates with stunning sunset views.',               image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80' },
  { icon: '🅿️', title: 'Valet Parking',          description: 'Convenient valet service available 24/7 with in-and-out privileges.',       image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&q=80' },
  { icon: '📶', title: 'High-Speed WiFi',         description: 'Complimentary gigabit WiFi throughout the hotel and all guest rooms.',      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80' },
  { icon: '🐕', title: 'Pet-Friendly',            description: 'Your furry friends are welcome! Pet beds, bowls, and treats provided.',     image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80' },
  { icon: '🏪', title: '24-Hour Concierge',       description: 'Our dedicated team is available around the clock for any request.',         image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
  { icon: '💼', title: 'Business Center',         description: 'Fully equipped meeting rooms, printing, and secretarial services.',         image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' },
  { icon: '🌿', title: 'Rooftop Garden',          description: 'Beautiful landscaped gardens for relaxation and outdoor events.',           image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80' },
  { icon: '🚗', title: 'Airport Shuttle',         description: 'Complimentary shuttle service to the airport. Advance booking required.',   image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80' },
];

const Amenities = () => (
  <>
    <div className="what-we-offer">
      <div className="wwo-header">
        <h2>Hotel Amenities</h2>
        <p>World-class facilities for an unforgettable stay</p>
      </div>

      <div className="wwo-grid wwo-grid--wrap">
        {amenities.map((a, i) => (
          <div key={i} className="wwo-card">
            <div className="wwo-img">
              <img src={a.image} alt={a.title} />
              <span className="wwo-icon">{a.icon}</span>
            </div>
            <h4>{a.title}</h4>
            <p>{a.description}</p>
          </div>
        ))}
      </div>

      <div className="amenities-footer">
        <p>All amenities are complimentary for hotel guests unless otherwise noted.</p>
        <p>For more information, please contact our 24-hour concierge.</p>
      </div>
    </div>

    <FAQAndLocation />
    <FooterBar />
  </>
);

export default Amenities;
