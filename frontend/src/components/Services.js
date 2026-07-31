import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useCurrency, convertPrice } from '../CurrencyContext';
import { useI18n } from '../LanguageContext';
import { FAQAndLocation, FooterBar } from './Footer';
import '../styles/Services.css';

const CATEGORY_ICONS = {
  'Food & Beverage': '🍽️',
  'Wellness & Spa':  '💆',
  'Fitness':         '🏋️',
  'Transport':       '🚐',
  'Facilities':      '🏢',
  'Recreation':      '🎠',
  'Other':           '✨',
};

const MENU_CAT_ICONS = {
  'Starter':     '🥗',
  'Main Course': '🍛',
  'Dessert':     '🍰',
  'Drink':       '🥤',
  'Breakfast':   '🍳',
  'Vegan':       '🥦',
  'Special':     '⭐',
};

// Sub-menu items grid shown under a service category section
const ServiceSubMenu = ({ items, currency, rates, t }) => {
  const [catFilter, setCatFilter] = React.useState('All');
  const cats = ['All', ...new Set(items.map(i => i.category))];
  const filtered = catFilter === 'All' ? items : items.filter(i => i.category === catFilter);

  return (
    <div className="svc-submenu">
      <div className="svc-submenu-header">
        <span className="svc-submenu-title">{t ? t('menu.subMenuTitle') : '📋 Available Packages & Pricing'}</span>
        <div className="svc-submenu-cats">
          {cats.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`svc-submenu-cat-btn${catFilter === c ? ' active' : ''}`}
            >{t ? (t(`menu.categories.${c}`) || c) : c}</button>
          ))}
        </div>
      </div>
      <div className="svc-submenu-grid">
        {filtered.map(item => (
          <div key={item.id} className="svc-submenu-card">
            {item.image && (
              <div className="svc-submenu-img-wrap">
                <img src={item.image} alt={item.name} className="svc-submenu-img" loading="lazy" />
              </div>
            )}
            <div className="svc-submenu-body">
              <div className="svc-submenu-top">
                <h4 className="svc-submenu-name">{t ? (t(`menu.items.${item.name}`) || item.name) : item.name}</h4>
                <span className="svc-submenu-price">
                  {Number(item.price) === 0
                    ? (t ? t('menu.free') : 'Free')
                    : convertPrice(Number(item.price), currency, rates)}
                </span>
              </div>
              {item.description && <p className="svc-submenu-desc">
                {t ? (t(`menu.descriptions.${item.name}`) || item.description) : item.description}
              </p>}
              <span className="svc-submenu-cat-badge">{t ? (t(`menu.categories.${item.category}`) || item.category) : item.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuItemCard = ({ item, currency, rates, t }) => (
  <div className="menu-item-card">
    <div className="menu-item-img-wrap">
      {item.image
        ? <img src={item.image} alt={item.name} className="menu-item-img" loading="lazy" />
        : <div className="menu-item-img-placeholder">{MENU_CAT_ICONS[item.category] || '🍽️'}</div>
      }
    </div>
    <div className="menu-item-body">
      <div className="menu-item-top">
        <h4 className="menu-item-name">{t ? (t(`menu.items.${item.name}`) || item.name) : item.name}</h4>
        <span className="menu-item-price">{convertPrice(Number(item.price), currency, rates)}</span>
      </div>
      {item.description && (
        <p className="menu-item-desc">
          {t ? (t(`menu.descriptions.${item.name}`) || item.description) : item.description}
        </p>
      )}
      <span className="menu-item-cat">{MENU_CAT_ICONS[item.category] || '🍽️'} {t ? (t(`menu.categories.${item.category}`) || item.category) : item.category}</span>
    </div>
  </div>
);

// Translation mapping for service categories
const CATEGORY_TRANSLATIONS = {
  en: {
    'Food & Beverage': 'Food & Beverage',
    'Wellness & Spa': 'Wellness & Spa',
    'Fitness': 'Fitness',
    'Transport': 'Transport',
    'Facilities': 'Facilities',
    'Recreation': 'Recreation',
    'Other': 'Other',
  },
  am: {
    'Food & Beverage': 'ምግብ እና መጠጥ',
    'Wellness & Spa': 'ደህንነት እና ስፓ',
    'Fitness': 'ስፖርት',
    'Transport': 'መጓጓዣ',
    'Facilities': 'መገልገያዎች',
    'Recreation': 'አዝናኝ',
    'Other': 'ሌሎችም',
  },
};

// Translation mapping for service names and descriptions
const SERVICE_TRANSLATIONS = {
  en: {
    // Common service names
    'Breakfast': 'Breakfast',
    'Lunch': 'Lunch',
    'Dinner': 'Dinner',
    'Room Service': 'Room Service',
    'Bar': 'Bar',
    'Restaurant': 'Restaurant',
    'Spa': 'Spa',
    'Massage': 'Massage',
    'Facial': 'Facial',
    'Gym': 'Gym',
    'Fitness Center': 'Fitness Center',
    'Pool': 'Pool',
    'Swimming Pool': 'Swimming Pool',
    'WiFi': 'WiFi',
    'Internet': 'Internet',
    'Parking': 'Parking',
    'Valet Parking': 'Valet Parking',
    'Shuttle': 'Shuttle',
    'Airport Shuttle': 'Airport Shuttle',
    'Concierge': 'Concierge',
    'Front Desk': 'Front Desk',
    'Housekeeping': 'Housekeeping',
    'Laundry': 'Laundry',
    'Dry Cleaning': 'Dry Cleaning',
    'Business Center': 'Business Center',
    'Meeting Room': 'Meeting Room',
    'Conference Room': 'Conference Room',
    'Garden': 'Garden',
    'Terrace': 'Terrace',
    'Rooftop': 'Rooftop',
    'Lounge': 'Lounge',
    'Kids Club': 'Kids Club',
    'Playground': 'Playground',
    'Pet Friendly': 'Pet Friendly',
    'Pet Care': 'Pet Care',
    'Security': 'Security',
    '24/7 Service': '24/7 Service',
    'Sauna': 'Sauna',
    'Steam Room': 'Steam Room',
    'Yoga': 'Yoga',
    'Pilates': 'Pilates',
    'Tennis Court': 'Tennis Court',
    'Golf Course': 'Golf Course',
    'Bicycle Rental': 'Bicycle Rental',
    'Car Rental': 'Car Rental',
    'Tour Desk': 'Tour Desk',
    'Ticket Service': 'Ticket Service',
    'Currency Exchange': 'Currency Exchange',
    'ATM': 'ATM',
    'Safe Deposit': 'Safe Deposit',
    'Luggage Storage': 'Luggage Storage',
    'Elevator': 'Elevator',
    'Wheelchair Access': 'Wheelchair Access',
    'Doctor on Call': 'Doctor on Call',
    'Babysitting': 'Babysitting',
    'Wedding Services': 'Wedding Services',
    'Event Planning': 'Event Planning',
    'Catering': 'Catering',
    'Banquet Hall': 'Banquet Hall',
    'Ballroom': 'Ballroom',
    'Nightclub': 'Nightclub',
    'Live Music': 'Live Music',
    'Karaoke': 'Karaoke',
    'Cinema': 'Cinema',
    'Game Room': 'Game Room',
    'Library': 'Library',
    'Gift Shop': 'Gift Shop',
    'Florist': 'Florist',
    'Hair Salon': 'Hair Salon',
    'Beauty Salon': 'Beauty Salon',
    'Nail Salon': 'Nail Salon',
    'Jewelry Shop': 'Jewelry Shop',
    'Boutique': 'Boutique',
    'Sky Bar & Lounge': 'Sky Bar & Lounge',
    'Café & Bakery': 'Café & Bakery',
    'Mini Bar': 'Mini Bar',
    'Spa & Wellness Center': 'Spa & Wellness Center',
    'Sauna & Steam Room': 'Sauna & Steam Room',
    'Jacuzzi & Hot Tub': 'Jacuzzi & Hot Tub',
    'Yoga & Meditation': 'Yoga & Meditation',
    'City Tour': 'City Tour',
    'Laundry & Dry Cleaning': 'Laundry & Dry Cleaning',
    'Concierge Service': 'Concierge Service',
    'Games Room': 'Games Room',
    'Library & Reading Lounge': 'Library & Reading Lounge',
  },
  am: {
    // Common service names
    'Breakfast': 'ቁርስ',
    'Lunch': 'ልምግት',
    'Dinner': 'ምሽት',
    'Room Service': 'የክፍል አገልግሎት',
    'Bar': 'ባር',
    'Restaurant': 'ምግብ ቤት',
    'Spa': 'ስፓ',
    'Massage': 'ማሳጅ',
    'Facial': 'ፊት ሕክምና',
    'Gym': 'ጂም',
    'Fitness Center': 'የስፖርት ማዕከል',
    'Pool': 'ፑል',
    'Swimming Pool': 'የአጥር ፑል',
    'WiFi': 'WiFi',
    'Internet': 'ኢንተርኔት',
    'Parking': 'ፓርኪንግ',
    'Valet Parking': 'ቫሌ ፓርኪንግ',
    'Shuttle': 'ሸዴ',
    'Airport Shuttle': 'የአውሮፕላን ሸዴ',
    'Concierge': 'አስተናጋጅ',
    'Front Desk': 'የፊት ዴስክ',
    'Housekeeping': 'የቤት አገልግሎት',
    'Laundry': 'የክፍል ማጽዳት',
    'Dry Cleaning': 'የደረቅ እሸት ማጽዳት',
    'Business Center': 'የሥራ ማዕከል',
    'Meeting Room': 'የስብሰባ ክፍል',
    'Conference Room': 'የኮንፈረንስ ክፍል',
    'Garden': 'አትክልት ቦታ',
    'Terrace': 'ቴራስ',
    'Rooftop': 'ጣሪያ',
    'Lounge': 'ማረፊያ',
    'Kids Club': 'የልጆች ክለብ',
    'Playground': 'የልጆች መንገድ',
    'Pet Friendly': 'የቤት እንስሳ ተቀባይ',
    'Pet Care': 'የቤት እንስሳ አገልግሎት',
    'Security': 'ደህንነት',
    '24/7 Service': '24 ሰዓት አገልግሎት',
    'Sauna': 'ሳውና',
    'Steam Room': 'የእንባባ ክፍል',
    'Yoga': 'ዮጋ',
    'Pilates': 'ፒላቲስ',
    'Tennis Court': 'የቴኒስ ሜዳ',
    'Golf Course': 'የጎልፍ ሜዳ',
    'Bicycle Rental': 'የብስክሌት ኪራስ',
    'Car Rental': 'የመኪና ኪራስ',
    'Tour Desk': 'የጉብኝ መረጃ',
    'Ticket Service': 'የትኬት አገልግሎት',
    'Currency Exchange': 'የገንዘብ ልውውጥ',
    'ATM': 'ATM',
    'Safe Deposit': 'ደህንነቱ የተጠበቀ አስተካካሽ',
    'Luggage Storage': 'የጫማ ማከማቻ',
    'Elevator': 'ኤሌቭተር',
    'Wheelchair Access': 'የቁርጋ መኪና መግቢያ',
    'Doctor on Call': 'ዶክተር በጥሪ',
    'Babysitting': 'የልጅ አስተናጋጅ',
    'Wedding Services': 'የሙሽራ አገልግሎት',
    'Event Planning': 'የዝግጅት አሰራርብ',
    'Catering': 'ኬተሪንግ',
    'Banquet Hall': 'የበዓል አዳራሽ',
    'Ballroom': 'ባልሩም',
    'Nightclub': 'የሌሊት ክለብ',
    'Live Music': 'በቀጥታ ሙዚቃ',
    'Karaoke': 'ካራኦኬ',
    'Cinema': 'ሲኔማ',
    'Game Room': 'የጨዋታ ክፍል',
    'Library': 'ቤተ መጻልፍት',
    'Gift Shop': 'የስጦታ መደብር',
    'Florist': 'የአበራ ሸቀጣሸቀጥ',
    'Hair Salon': 'የጸጉር ሳሎን',
    'Beauty Salon': 'የውበት ሳሎን',
    'Nail Salon': 'የጥፍር ጥቁር ሳሎን',
    'Jewelry Shop': 'የወርቅ መደብር',
    'Boutique': 'ቡቲክ',
    'Sky Bar & Lounge': 'የጣሪያ ባር እና ማረፊያ',
    'Café & Bakery': 'ካፌ እና የእንቁል ቤት',
    'Mini Bar': 'ትንሽ ባር',
    'Spa & Wellness Center': 'ስፓ እና የጤና ማዕከል',
    'Sauna & Steam Room': 'ሳውና እና የእንባባ ክፍል',
    'Jacuzzi & Hot Tub': 'ጃኩዚ እና ሙቅ አቧት',
    'Yoga & Meditation': 'ዮጋ እና ማስታወስ',
    'City Tour': 'የከተማ ጉብኝ',
    'Laundry & Dry Cleaning': 'የክፍል ማጽዳት እና የደረቅ እሸት ማጽዳት',
    'Concierge Service': 'የአስተናጋጅ አገልግሎት',
    'Games Room': 'የጨዋታ ክፍል',
    'Library & Reading Lounge': 'ቤተ መጻልፍት እና የማንበት ማረፊያ',
  },
};

const Services = () => {
  const [services, setServices]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const { currency, rates }         = useCurrency();
  const { t, language }             = useI18n();
  // Restaurant menu state
  const [menuItems, setMenuItems]         = useState([]);
  const [menuCatFilter, setMenuCatFilter] = useState('All');
  const [menuCategories, setMenuCategories] = useState([]);
  // Service sub-menus (spa, fitness, transport, etc.)
  const [serviceMenus, setServiceMenus]   = useState({});

  // Translate category name based on current language
  const translateCategory = (category) => {
    if (category === 'All') return language === 'am' ? 'ሁሉም' : 'All';
    return CATEGORY_TRANSLATIONS[language]?.[category] || category;
  };

  // Translate service name based on current language
  const translateServiceName = (name) => {
    return SERVICE_TRANSLATIONS[language]?.[name] || name;
  };

  // Translate location based on current language
  const translateLocation = (location) => {
    if (!location) return location;
    
    const locTranslations = {
      en: {
        'Ground Floor — Main Dining Hall': 'Ground Floor — Main Dining Hall',
        'Rooftop — Floor 12': 'Rooftop — Floor 12',
        'Lobby Level': 'Lobby Level',
        'All Rooms': 'All Rooms',
        'Floor 2 — Spa Wing': 'Floor 2 — Spa Wing',
        'Floor 2 — Pool Area': 'Floor 2 — Pool Area',
        'Floor 1 — East Wing': 'Floor 1 — East Wing',
        'Floor 1 — Pool Deck': 'Floor 1 — Pool Deck',
        'Floor 2 — Wellness Studio': 'Floor 2 — Wellness Studio',
        'Hotel Entrance — advance booking required': 'Hotel Entrance — advance booking required',
        'Concierge Desk': 'Concierge Desk',
        'Floor 1 — Business Lounge': 'Floor 1 — Business Lounge',
        'Floor 3 — Conference Center': 'Floor 3 — Conference Center',
        'Request via Reception': 'Request via Reception',
        'Lobby — Concierge Desk': 'Lobby — Concierge Desk',
        'Hotel Main Entrance': 'Hotel Main Entrance',
        'Floor 1 — Garden Level': 'Floor 1 — Garden Level',
        'Floor B1 — Recreation Center': 'Floor B1 — Recreation Center',
        'Floor 1 — East Lounge': 'Floor 1 — East Lounge',
      },
      am: {
        'Ground Floor — Main Dining Hall': 'መሬት ፎቅ — ዋና የመመገቢያ አዳራሽ',
        'Rooftop — Floor 12': 'ጣሪያ — ፎቅ 12',
        'Lobby Level': 'ሎቢ ደረጃ',
        'All Rooms': 'ሁሉም ክፍሎች',
        'Floor 2 — Spa Wing': 'ፎቅ 2 — የስፓ ክፍል',
        'Floor 2 — Pool Area': 'ፎቅ 2 — የፑል አካባቢ',
        'Floor 1 — East Wing': 'ፎቅ 1 — ምስራቅ ክፍል',
        'Floor 1 — Pool Deck': 'ፎቅ 1 — የፑል መደብር',
        'Floor 2 — Wellness Studio': 'ፎቅ 2 — የጤና ማስልሰት',
        'Hotel Entrance — advance booking required': 'የሆቴሉ መግቢያ — በፊት ቦታ ማስያዝ ያስፈልጋል',
        'Concierge Desk': 'የአስተናጋጅ ዴስክ',
        'Floor 1 — Business Lounge': 'ፎቅ 1 — የሥራ ማረፊያ',
        'Floor 3 — Conference Center': 'ፎቅ 3 — የኮንፈረንስ ማዕከል',
        'Request via Reception': 'በሎቢ ዴስክ ይጠይቁ',
        'Lobby — Concierge Desk': 'ሎቢ — የአስተናጋጅ ዴስክ',
        'Hotel Main Entrance': 'ዋና የሆቴሉ መግቢያ',
        'Floor 1 — Garden Level': 'ፎቅ 1 — የአትክልት ደረጃ',
        'Floor B1 — Recreation Center': 'ፎቅ B1 — የአዝናኝ ማዕከል',
        'Floor 1 — East Lounge': 'ፎቅ 1 — ምስራቅ ማረፊያ',
      },
    };
    
    const translated = locTranslations[language]?.[location];
    if (translated) return translated;
    return location;
  };

  // Translate service description based on current language
  const translateDescription = (description) => {
    if (!description) return description;
    
    // Common description translations
    const descTranslations = {
      en: {
        'Available 24/7': 'Available 24/7',
        'Open daily': 'Open daily',
        'Complimentary': 'Complimentary',
        'Additional charges apply': 'Additional charges apply',
        'Reservation required': 'Reservation required',
        'Located on ground floor': 'Located on ground floor',
        'Located on rooftop': 'Located on rooftop',
        'Indoor': 'Indoor',
        'Outdoor': 'Outdoor',
        'Fine dining with local and international cuisine, crafted by our award-winning chefs.': 'Fine dining with local and international cuisine, crafted by our award-winning chefs.',
        'Ground Floor — Main Dining Hall': 'Ground Floor — Main Dining Hall',
        'Main Dining Hall': 'Main Dining Hall',
        'Award-winning cuisine': 'Award-winning cuisine',
        'Local and international cuisine': 'Local and international cuisine',
        'Heated pool with panoramic city views': 'Heated pool with panoramic city views',
        'Luxury massages, facials, and wellness therapies': 'Luxury massages, facials, and wellness therapies',
        'State-of-the-art gym with Peloton bikes': 'State-of-the-art gym with Peloton bikes',
        'Craft cocktails and small plates with stunning sunset views': 'Craft cocktails and small plates with stunning sunset views',
        'Convenient valet service available 24/7': 'Convenient valet service available 24/7',
        'Complimentary gigabit WiFi throughout the hotel': 'Complimentary gigabit WiFi throughout the hotel',
        'Your furry friends are welcome!': 'Your furry friends are welcome!',
        'Our dedicated team is available around the clock': 'Our dedicated team is available around the clock',
        'Fully equipped meeting rooms, printing, and secretarial services': 'Fully equipped meeting rooms, printing, and secretarial services',
        'Beautiful landscaped gardens for relaxation': 'Beautiful landscaped gardens for relaxation',
        'Complimentary shuttle service to the airport': 'Complimentary shuttle service to the airport',
        'Fully equipped business center with printing, scanning, and high-speed internet.': 'Fully equipped business center with printing, scanning, and high-speed internet.',
        'Panoramic rooftop bar offering handcrafted cocktails, wines, and stunning city views.': 'Panoramic rooftop bar offering handcrafted cocktails, wines, and stunning city views.',
        'Fresh pastries, artisan coffees, and light snacks served all day.': 'Fresh pastries, artisan coffees, and light snacks served all day.',
        '24-hour in-room dining from our full restaurant menu.': '24-hour in-room dining from our full restaurant menu.',
        'In-room mini bar stocked with beverages, snacks, and premium spirits.': 'In-room mini bar stocked with beverages, snacks, and premium spirits.',
        'Full-service spa with massages, facials, body wraps, and aromatherapy treatments.': 'Full-service spa with massages, facials, body wraps, and aromatherapy treatments.',
        'Traditional Finnish sauna and steam room for ultimate relaxation.': 'Traditional Finnish sauna and steam room for ultimate relaxation.',
        'Private jacuzzi suites and shared hot tub with hydrotherapy jets.': 'Private jacuzzi suites and shared hot tub with hydrotherapy jets.',
        'State-of-the-art gym with free weights, cardio machines, and personal trainers.': 'State-of-the-art gym with free weights, cardio machines, and personal trainers.',
        'Heated outdoor pool and indoor lap pool, open year-round.': 'Heated outdoor pool and indoor lap pool, open year-round.',
        'Daily guided yoga and meditation classes for all skill levels.': 'Daily guided yoga and meditation classes for all skill levels.',
        'Comfortable and punctual airport transfers in air-conditioned vehicles.': 'Comfortable and punctual airport transfers in air-conditioned vehicles.',
        'Daily car rental with a choice of sedans, SUVs, and luxury vehicles.': 'Daily car rental with a choice of sedans, SUVs, and luxury vehicles.',
        'Guided half-day and full-day city tours with a professional guide.': 'Guided half-day and full-day city tours with a professional guide.',
        'Modern meeting and conference rooms for 10–200 guests with AV equipment.': 'Modern meeting and conference rooms for 10–200 guests with AV equipment.',
        'Same-day laundry and dry cleaning service for all garments.': 'Same-day laundry and dry cleaning service for all garments.',
        'Our concierge team is available 24/7 to arrange bookings, tours, and special requests.': 'Our concierge team is available 24/7 to arrange bookings, tours, and special requests.',
        'Secure valet parking service for all hotel guests.': 'Secure valet parking service for all hotel guests.',
        'Supervised indoor and outdoor activities for children aged 4–12.': 'Supervised indoor and outdoor activities for children aged 4–12.',
        'Pool table, table tennis, arcade games, and board games for all ages.': 'Pool table, table tennis, arcade games, and board games for all ages.',
        'Quiet reading lounge with a curated selection of books and periodicals.': 'Quiet reading lounge with a curated selection of books and periodicals.',
      },
      am: {
        'Available 24/7': '24 ሰዓት ይገኛል',
        'Open daily': 'ዕለት ዕለት ክፍት ነው',
        'Complimentary': 'ነጻ',
        'Additional charges apply': 'ተጨማሪ ክፍያ ይኖራል',
        'Reservation required': 'ቦታ ማስያዝ ያስፈልጋል',
        'Located on ground floor': 'በመሬት ፎቅ ላይ ይገኛል',
        'Located on rooftop': 'በጣሪያ ላይ ይገኛል',
        'Indoor': 'በውስጥ',
        'Outdoor': 'በውጭ',
        'Fine dining with local and international cuisine, crafted by our award-winning chefs.': 'ከአካባቢ እና ከአለም አቀፍ ምግብ ጋር የተራቀቀ ምግብ ቤት፣ በሽልማት ያገኙ የምግብ ሰራተኞች የሚዘጋጁ።',
        'Ground Floor — Main Dining Hall': 'መሬት ፎቅ — ዋና የመመገቢያ አዳራሽ',
        'Main Dining Hall': 'ዋና የመመገቢያ አዳራሽ',
        'Award-winning cuisine': 'በሽልማት ያገኙ የምግብ አይነት',
        'Local and international cuisine': 'ከአካባቢ እና ከአለም አቀፍ ምግብ',
        'Heated pool with panoramic city views': 'ሙቅ ፑል ከሰፊ የከተማ እይታ ጋር',
        'Luxury massages, facials, and wellness therapies': 'የቅንጦት ማሳጅ፣ ፊት ሕክምና እና የጤና ሕክምናዎች',
        'State-of-the-art gym with Peloton bikes': 'ዘመናዊ ጂም ከፔሎተን ብስክሌቶች ጋር',
        'Craft cocktails and small plates with stunning sunset views': 'የተዘጋጀ ኮክቴል እና ትንሽ ምግብ ከሚያማምር የፀሐይ ስምጥ እይታ ጋር',
        'Convenient valet service available 24/7': 'ቀላል ቫሌ አገልግሎት 24 ሰዓት ይገኛል',
        'Complimentary gigabit WiFi throughout the hotel': 'ለሆቴሉ እንግዶች ያለ ምክር ጊጋቢት WiFi',
        'Your furry friends are welcome!': 'የሚወዷቸው ቤት እንስሳዎቻቸው ተቀባይ ናቸው!',
        'Our dedicated team is available around the clock': 'ቡድናችን ለማንኛውም ጥያቄ ሁልጊዜ ዝግጁ ነው',
        'Fully equipped meeting rooms, printing, and secretarial services': 'ሙሉ ስብሰባ ክፍሎች፣ ማተሚያ እና ፀሐፊ አገልግሎቶች',
        'Beautiful landscaped gardens for relaxation': 'ለዘና ያለ ቆንጆ የዛፍ አካባቢ',
        'Complimentary shuttle service to the airport': 'ወደ አውሮፕላን ማረፊያ ያለ ነጻ ሸዴ',
        'Fully equipped business center with printing, scanning, and high-speed internet.': 'ሙሉ የሥራ ማዕከል ከማተሚያ፣ ስካኒንግ እና ከፍጥረት ፍጥነት ኢንተርኔት ጋር።',
        'Panoramic rooftop bar offering handcrafted cocktails, wines, and stunning city views.': 'ከጣሪያ የሚገኝ ባር የተዘጋጀ ኮክቴል፣ ወይን እና አስደናቂ የከተማ እይታ ያለው።',
        'Fresh pastries, artisan coffees, and light snacks served all day.': 'እንቁል የተሰራ ፓስትሪ፣ የአርቲዛን ካፌ እና ቀላል ምግቦች በአንድ ቀን ይሰጣሉ።',
        '24-hour in-room dining from our full restaurant menu.': '24 ሰዓት የክፍል ውስጥ ምግብ ከሙሉ የምግብ ቤት ዝርዝር።',
        'In-room mini bar stocked with beverages, snacks, and premium spirits.': 'የክፍል ውስጥ ትንሽ ባር ከመጠጦት፣ ትንሽ ምግቦች እና የከፍተኛ ጥራት የተሞላ።',
        'Full-service spa with massages, facials, body wraps, and aromatherapy treatments.': 'ሙሉ አገልግሎት ስፓ ከማሳጅ፣ ፊት ሕክምና፣ የአካል መጠጥ እና የአሮማ ሕክምና ጋር።',
        'Traditional Finnish sauna and steam room for ultimate relaxation.': 'ባህላዊ የፊንላንድ ሳውና እና የእንባባ ክፍል ለፍጹም ዘና።',
        'Private jacuzzi suites and shared hot tub with hydrotherapy jets.': 'የግል ጃኩዚ ሲውት እና የጋራ ሙቅ አቧት ከሃይድሮቴራፒ ጀትስ ጋር።',
        'State-of-the-art gym with free weights, cardio machines, and personal trainers.': 'ዘመናዊ ጂም ከነጻ ክብደቶች፣ የካርዲዮ ማሽንኦች እና የግል ማሰልሰያዎች ጋር።',
        'Heated outdoor pool and indoor lap pool, open year-round.': 'ሙቅ የውጭ ፑል እና የውትጥ ላፕ ፑል፣ በአንድ ዓመት ይከፍታል።',
        'Daily guided yoga and meditation classes for all skill levels.': 'ለሁሉም ደረጃዎች ዕለታዊ የተመራ ዮጋ እና ማስታወስ ክፍሎች።',
        'Comfortable and punctual airport transfers in air-conditioned vehicles.': 'በአየር ማቀዝቀዝ የተሸከሙ መጓጓዣዎች በንቁሮች እና በጊዜ የሚደርሱ የአውሮፕላን ማረፊያ ሸዴ።',
        'Daily car rental with a choice of sedans, SUVs, and luxury vehicles.': 'ዕለታዊ የመኪና ኪራስ ከሴዳን፣ ኤስዩቪዎች እና የልዩክስ መጓጓዣዎች ምርጫ ጋር።',
        'Guided half-day and full-day city tours with a professional guide.': 'ከፀሐፊ መመሪያ ጋር የግማሽ ቀን እና የሙሉ ቀን የከተማ ጉብኝ።',
        'Modern meeting and conference rooms for 10–200 guests with AV equipment.': 'ዘመናዊ የስብሰባ እና የኮንፈረንስ ክፍሎች ለ10-200 እንግዶች ከኤቪ መሳሪያዎች ጋር።',
        'Same-day laundry and dry cleaning service for all garments.': 'ለሁሉም ክፍሎች የቀን ውስጥ የክፍል ማጽዳት እና የደረቅ እሸት ማጽዳት አገልግሎት።',
        'Our concierge team is available 24/7 to arrange bookings, tours, and special requests.': 'የአስተናጋጅ ቡድናችን ቦታ ማስያዝ፣ ጉብኝ እና ልዩ ጥያቄዎችን ለማስተናከል 24 ሰዓት ይገኛል።',
        'Secure valet parking service for all hotel guests.': 'ደህንነቱ የተጠበቀ ቫሌ ፓርኪንግ አገልግሎት ለሁሉም የሆቴሉ እንግዶች።',
        'Supervised indoor and outdoor activities for children aged 4–12.': 'ለከ4-12 ዓመት ልጆች የተቆጣጠረ የውስጥ እና የውጭ እጩትነቶች።',
        'Pool table, table tennis, arcade games, and board games for all ages.': 'የፑል ቴብል፣ የቴብል ቲጂኒ፣ የአርኬድ ጨዋታዎች እና የቦርድ ጨዋታዎች ለሁሉም እድሜ።',
        'Quiet reading lounge with a curated selection of books and periodicals.': 'ሰማያዊ የማንበት ማረፊያ ከተመረጡ መጻልፍት እና ጋዜጣዎች ጋር።',
      },
    };
    
    // Try to match known descriptions
    const translated = descTranslations[language]?.[description];
    if (translated) return translated;
    
    // If no exact match, return original
    return description;
  };

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([
        api.get('/services'),
        api.get('/services/categories'),
      ]);
      setServices(svcRes.data);
      setCategories(['All', ...catRes.data.filter(c => c !== 'Food & Beverage')]);

      // Load restaurant menu separately
      try {
        const menuRes = await api.get('/menu?serviceCategory=Restaurant');
        const items = menuRes.data.items || [];
        setMenuItems(items);
        const cats = [...new Set(items.map(i => i.category))];
        setMenuCategories(cats);
      } catch (menuErr) {
        console.warn('[Menu] Could not load restaurant menu:', menuErr.message);
      }

      // Load all service sub-menus (spa, fitness, transport, etc.)
      try {
        const allMenuRes = await api.get('/menu?serviceCategory=all');
        const allItems = allMenuRes.data.items || [];
        // Group by serviceCategory
        const grouped = {};
        for (const item of allItems) {
          if (item.serviceCategory === 'Restaurant') continue;
          if (!grouped[item.serviceCategory]) grouped[item.serviceCategory] = [];
          grouped[item.serviceCategory].push(item);
        }
        setServiceMenus(grouped);
      } catch (e) {
        console.warn('[Menu] Could not load service menus:', e.message);
      }
    } catch (err) {
      setError('Unable to load hotel services. Please try again later.');
      console.error('Services fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // Hide Food & Beverage from public view — the Restaurant Menu section below covers food
  const HIDDEN_CATEGORIES = ['Food & Beverage'];

  const displayed = activeCategory === 'All'
    ? services.filter(s => !HIDDEN_CATEGORIES.includes(s.category))
    : services.filter(s => s.category === activeCategory && !HIDDEN_CATEGORIES.includes(s.category));

  // Group by category for the "All" view
  const grouped = displayed.reduce((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const formatHours = (from, to) => {
    if (!from && !to) return null;
    if (from === '00:00' && to === '23:59') return '24 hours';
    return `${from || '—'} – ${to || '—'}`;
  };

  const formatPrice = useCallback((service) => {
    if (service.price == null) return t('services.complimentary');
    return convertPrice(Number(service.price), currency, rates);
  }, [currency, rates, t]);

  if (loading) {
    return (
      <div className="svc-loading">
        <div className="svc-spinner" />
        <p>{t('services.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="svc-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchServices}>{t('services.retry')}</button>
      </div>
    );
  }

  return (
    <div className="svc-page">

      {/* Hero banner */}
      <div className="svc-hero">
        <div className="svc-hero-overlay">
          <h1 className="svc-hero-title">{t('services.title')}</h1>
          <p className="svc-hero-sub">
            {t('services.subtitle')}
          </p>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="svc-tabs-wrap">
        <div className="svc-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`svc-tab ${activeCategory === cat ? 'svc-tab--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== 'All' && (CATEGORY_ICONS[cat] || '✨')} {translateCategory(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Services content */}
      <div className="svc-content">
        {services.length === 0 ? (
          <div className="svc-empty">
            <span>🏨</span>
            <p>{t('services.noServices')}</p>
          </div>
        ) : activeCategory === 'All' ? (
          // Grouped by category — each section shows its service cards + sub-menu
          Object.entries(grouped).map(([cat, items]) => (
            <section key={cat} className="svc-section">
              <div className="svc-section-header">
                <span className="svc-section-icon">{CATEGORY_ICONS[cat] || '✨'}</span>
                <h2 className="svc-section-title">{translateCategory(cat)}</h2>
                <span className="svc-section-count">{items.length} {t('services.serviceCount', { count: items.length })}</span>
              </div>
              <div className="svc-grid">
                {items.map(s => (
                  <ServiceCard key={s.id} service={s} formatHours={formatHours} formatPrice={formatPrice} translateServiceName={translateServiceName} translateDescription={translateDescription} translateLocation={translateLocation} />
                ))}
              </div>
              {/* Sub-menu items for this service category */}
              {serviceMenus[cat] && serviceMenus[cat].length > 0 && (
                <ServiceSubMenu items={serviceMenus[cat]} currency={currency} rates={rates} t={t} />
              )}
            </section>
          ))
        ) : (
          // Single category flat grid
          <div className="svc-grid svc-grid--single">
            {displayed.map(s => (
              <ServiceCard key={s.id} service={s} formatHours={formatHours} formatPrice={formatPrice} translateServiceName={translateServiceName} translateDescription={translateDescription} translateLocation={translateLocation} />
            ))}
          </div>
        )}
      </div>

      {/* ── Restaurant Menu Section ── */}
      {menuItems.length > 0 && (
        <div className="menu-section">
          <div className="menu-section-header">
            <span className="menu-section-icon">🍽️</span>
            <div>
              <h2 className="menu-section-title">{t('menu.sectionTitle')}</h2>
              <p className="menu-section-sub">{t('menu.sectionSub')}</p>
            </div>
          </div>

          {/* Menu category tabs */}
          <div className="menu-cat-tabs">
            {['All', ...menuCategories].map(cat => (
              <button
                key={cat}
                className={`menu-cat-tab ${menuCatFilter === cat ? 'menu-cat-tab--active' : ''}`}
                onClick={() => setMenuCatFilter(cat)}
              >
                {cat !== 'All' && (MENU_CAT_ICONS[cat] || '🍽️')} {t(`menu.categories.${cat}`) || cat}
              </button>
            ))}
          </div>

          {/* Menu items grid — grouped by category */}
          {menuCatFilter === 'All' ? (
            menuCategories.map(cat => {
              const catItems = menuItems.filter(i => i.category === cat);
              if (!catItems.length) return null;
              return (
                <div key={cat} className="menu-cat-group">
                  <div className="menu-cat-label">
                    <span>{MENU_CAT_ICONS[cat] || '🍽️'}</span> {t(`menu.categories.${cat}`) || cat}
                  </div>
                  <div className="menu-grid">
                    {catItems.map(item => (
                      <MenuItemCard key={item.id} item={item} currency={currency} rates={rates} t={t} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="menu-grid">
              {menuItems.filter(i => i.category === menuCatFilter).map(item => (
                <MenuItemCard key={item.id} item={item} currency={currency} rates={rates} t={t} />
              ))}
            </div>
          )}
        </div>
      )}

      <FAQAndLocation />
      <FooterBar />
    </div>
  );
};

const ServiceCard = ({ service: s, formatHours, formatPrice, translateServiceName, translateDescription, translateLocation }) => {
  const hours = formatHours(s.availableFrom, s.availableTo);
  const price = formatPrice(s);
  const isFree = !s.price && !s.priceLabel;

  return (
    <div className={`svc-card ${s.status === 'inactive' ? 'svc-card--inactive' : ''} ${s.image ? 'svc-card--has-img' : ''}`}>
      {s.image && (
        <div className="svc-card-img-wrap">
          <img src={s.image} alt={s.name} className="svc-card-img" loading="lazy" />
          <div className="svc-card-img-overlay" />
        </div>
      )}
      <div className="svc-card-body">
        {!s.image && <div className="svc-card-icon">{s.icon || '🏨'}</div>}
        <div className="svc-card-top">
          <h3 className="svc-card-name">{translateServiceName(s.name)}</h3>
          <span className={`svc-price-badge ${isFree ? 'svc-price-badge--free' : ''}`}>
            {price}
          </span>
        </div>

        {s.description && (
          <p className="svc-card-desc">{translateDescription(s.description)}</p>
        )}

        <div className="svc-card-meta">
          {hours && (
            <span className="svc-meta-item">
              <span className="svc-meta-icon">🕐</span> {hours}
            </span>
          )}
          {s.location && (
            <span className="svc-meta-item">
              <span className="svc-meta-icon">📍</span> {translateLocation(s.location)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;
