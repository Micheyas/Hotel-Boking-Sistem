import React, { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What are the check-in and check-out times?',
      answer: 'Check-in starts at 3:00 PM and check-out is until 12:00 PM. Early check-in and late check-out are available upon request and subject to availability. Additional charges may apply.',
    },
    {
      question: 'Is parking available at the hotel?',
      answer: 'Yes, we offer valet parking at $45 per night with in-and-out privileges. Self-parking options are also available nearby. Electric vehicle charging stations are available.',
    },
    {
      question: 'Do you allow pets?',
      answer: 'Yes! We are pet-friendly and welcome your furry companions. A $75 non-refundable cleaning fee applies per stay. Pet weight limit is 50 lbs. Pet beds, bowls, and treats are provided.',
    },
    {
      question: 'Is breakfast included with the room?',
      answer: 'Breakfast is included with Deluxe Room and Suite bookings. Standard rooms can add breakfast for $25 per person. Our breakfast buffet includes hot and cold items, fresh pastries, and made-to-order stations.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'Free cancellation up to 48 hours before check-in for a full refund. Cancellations within 48 hours incur one night\'s charge. No-shows will be charged the full stay amount.',
    },
    {
      question: 'Do you have a pool and spa?',
      answer: 'Yes! Our stunning rooftop infinity pool and full-service spa are open daily from 7 AM to 10 PM for hotel guests. Spa treatments can be booked in advance. Pool cabanas are available for rental.',
    },
    {
      question: 'Is there a fitness center?',
      answer: 'Our 24/7 fitness center features state-of-the-art equipment including Peloton bikes, free weights, and cardio machines. Personal training sessions are available upon request.',
    },
    {
      question: 'Do you offer airport transportation?',
      answer: 'We offer complimentary shuttle service to JFK and LaGuardia airports. Advance booking is required at least 24 hours prior. For other airports, our concierge can arrange private car service.',
    },
    {
      question: 'Is WiFi available?',
      answer: 'Complimentary high-speed gigabit WiFi is available throughout the hotel, including all guest rooms, common areas, and meeting spaces. Premium business WiFi is also available.',
    },
    {
      question: 'Do you have meeting or event spaces?',
      answer: 'Yes! We have over 10,000 square feet of flexible meeting and event space, including a grand ballroom and rooftop venues. Our event planning team can assist with all your needs.',
    },
    {
      question: 'What dining options are available?',
      answer: 'We feature a fine dining restaurant with locally sourced cuisine, a rooftop bar with craft cocktails, and 24-hour in-room dining. Special dietary needs can be accommodated with advance notice.',
    },
    {
      question: 'How can I contact the hotel?',
      answer: 'You can reach us at +1 (718) 555-0123 or email info@williamvale.com. Our 24-hour front desk is always available to assist you. For reservations, visit our website or call directly.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-section-compact">
      <div className="faq-header-compact">
        <h2>❓ FAQ</h2>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item-page ${openIndex === index ? 'open' : ''}`}
            onClick={() => toggleFAQ(index)}
          >
            <div className="faq-question">
              <h4>{faq.question}</h4>
              <span className="faq-toggle">{openIndex === index ? '−' : '+'}</span>
            </div>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="faq-contact-compact">
        <p>📞 +1 (718) 555-0123 | ✉️ info@williamvale.com</p>
      </div>
    </div>
  );
};

export default FAQ;
