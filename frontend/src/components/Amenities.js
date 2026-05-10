import React from 'react';

const Amenities = () => {
  const amenities = [
    {
      icon: '🏊',
      title: 'Rooftop Infinity Pool',
      description: 'Stunning 60-foot heated pool with panoramic Manhattan skyline views. Open daily 7 AM - 10 PM.',
    },
    {
      icon: '💆',
      title: 'Full-Service Spa',
      description: 'Luxury spa treatments including massages, facials, and wellness therapies. Book your appointment.',
    },
    {
      icon: '🏋️',
      title: '24/7 Fitness Center',
      description: 'State-of-the-art gym with Peloton bikes, free weights, and personal training available.',
    },
    {
      icon: '🍽️',
      title: 'Fine Dining Restaurant',
      description: 'Award-winning cuisine with locally sourced ingredients and rooftop dining experience.',
    },
    {
      icon: '🍸',
      title: 'Rooftop Bar',
      description: 'Craft cocktails and small plates with the best sunset views in Brooklyn.',
    },
    {
      icon: '🅿️',
      title: 'Valet Parking',
      description: 'Convenient valet service available 24/7. $45 per night with in-and-out privileges.',
    },
    {
      icon: '📶',
      title: 'High-Speed WiFi',
      description: 'Complimentary gigabit WiFi throughout the hotel and all guest rooms.',
    },
    {
      icon: '🐕',
      title: 'Pet-Friendly',
      description: 'Your furry friends are welcome! Pet beds, bowls, and treats provided. $75 cleaning fee.',
    },
    {
      icon: '🏪',
      title: '24-Hour Concierge',
      description: 'Our dedicated team is available around the clock to assist with any request.',
    },
    {
      icon: '💼',
      title: 'Business Center',
      description: 'Fully equipped business center with meeting rooms, printing, and secretarial services.',
    },
    {
      icon: '🌿',
      title: 'Rooftop Garden',
      description: 'Beautiful landscaped gardens for relaxation and outdoor events.',
    },
    {
      icon: '🚗',
      title: 'Airport Shuttle',
      description: 'Complimentary shuttle service to JFK and LGA airports. Advance booking required.',
    },
  ];

  return (
    <div className="amenities-container">
      <div className="amenities-header">
        <h2>Hotel Amenities</h2>
        <p>World-class facilities for an unforgettable stay</p>
      </div>

      <div className="amenities-grid">
        {amenities.map((amenity, index) => (
          <div key={index} className="amenity-card">
            <div className="amenity-icon">{amenity.icon}</div>
            <h3>{amenity.title}</h3>
            <p>{amenity.description}</p>
          </div>
        ))}
      </div>

      <div className="amenities-footer">
        <p>All amenities are complimentary for hotel guests unless otherwise noted.</p>
        <p>For more information, please contact our 24-hour concierge.</p>
      </div>
    </div>
  );
};

export default Amenities;
