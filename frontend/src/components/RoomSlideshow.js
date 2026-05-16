import React, { useState, useEffect, useCallback } from 'react';

// Fallback images by room type keyword — real hotel photos
const FALLBACKS = [
  'https://images.unsplash.com/photo-1631049307038-da0ec9d70304?w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
];

const BASE_URL = 'http://localhost:5000';

/**
 * RoomSlideshow
 * Props:
 *   images      — array of paths (e.g. ['/uploads/rooms/x.jpg']) or full URLs
 *   image       — single fallback path (legacy)
 *   roomIndex   — number used to pick a consistent fallback set
 *   alt         — alt text
 *   autoPlay    — boolean (default true)
 *   interval    — ms between slides (default 4000)
 */
const RoomSlideshow = ({
  images = [],
  image = null,
  roomIndex = 0,
  alt = 'Room',
  autoPlay = true,
  interval = 4000,
}) => {
  // Build the final image list
  const buildList = () => {
    let list = [];

    // Use images array first
    if (Array.isArray(images) && images.length > 0) {
      list = images.map(img =>
        img.startsWith('http') ? img : `${BASE_URL}${img}`
      );
    } else if (image) {
      list = [image.startsWith('http') ? image : `${BASE_URL}${image}`];
    }

    // Pad with fallbacks up to 3 if fewer than 3 real images
    const fallbackStart = roomIndex % FALLBACKS.length;
    while (list.length < 3) {
      list.push(FALLBACKS[(fallbackStart + list.length) % FALLBACKS.length]);
    }

    return list.slice(0, 3);
  };

  const slides = buildList();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = () => {
    setCurrent(c => (c - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, interval, next, slides.length]);

  if (slides.length === 1) {
    return (
      <div className="rs-wrapper">
        <img src={slides[0]} alt={alt} className="rs-img" />
      </div>
    );
  }

  return (
    <div className="rs-wrapper">
      {/* Slides */}
      {slides.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`${alt} ${i + 1}`}
          className={`rs-img rs-slide ${i === current ? 'rs-active' : ''}`}
        />
      ))}

      {/* Prev / Next arrows */}
      <button className="rs-arrow rs-prev" onClick={e => { e.stopPropagation(); prev(); }}>‹</button>
      <button className="rs-arrow rs-next" onClick={e => { e.stopPropagation(); next(); }}>›</button>

      {/* Dot indicators */}
      <div className="rs-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`rs-dot ${i === current ? 'rs-dot--active' : ''}`}
            onClick={e => { e.stopPropagation(); setCurrent(i); }}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomSlideshow;
