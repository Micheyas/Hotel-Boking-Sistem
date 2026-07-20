# 2RN Solomon — Hotel Booking System

A full-stack hotel management platform built with React and Node.js. Covers the complete guest journey from availability search to check-out, plus a staff portal for receptionists, managers, and admins.

---

## Live Features

### Guest-Facing
- **Availability Search** — check dates and guest count before booking
- **Room Gallery** — browse all rooms with photos, amenities, bed type, size, and pricing
- **Online Booking** — logged-in customers book specific rooms
- **Guest Booking** — walk-in/phone guests book without an account
- **Loyalty Discounts** — returning guests automatically receive 5–15% discount based on booking history
- **Payment Proof Upload** — guests upload a payment screenshot for staff verification
- **Hotel Services Menu** — public `/services` page listing Bar, Restaurant, Spa, Gym, Pool, Transport, and more — grouped by category with hours and pricing
- **Guest Reviews** — 5-star ratings with comments per room
- **Multi-Currency** — live ETB / USD / GBP / EUR conversion in the navbar
- **Bilingual UI** — English / Amharic toggle

### Staff Portal (`/admin`)
All three staff roles share one login page. Access is role-gated.

| Feature | Admin | Manager | Receptionist |
|---|:---:|:---:|:---:|
| View all bookings | ✅ | ✅ | ✅ |
| Approve / Reject bookings | ✅ | ✅ | ✅ |
| Override previous decisions | ✅ | ✅ | — |
| Payment verification | ✅ | ✅ | ✅ |
| Booking History (filters, export) | ✅ | ✅ | ✅ |
| Repeat Customer tracking | ✅ | — | ✅ |
| Room Management (add/edit/delete) | ✅ | ✅ | — |
| Hotel Services Management | ✅ | ✅ | — |
| Offers tab | ✅ | ✅ | ✅ |
| Stats cards (revenue, totals) | ✅ | ✅ | — |

#### Booking History tab
- Filter by status, booking type, payment status, check-in date range, and free-text search
- Sortable columns (ID, check-in, check-out, amount, booked-on)
- Expandable rows showing phone, nights, reception notes, payment proof
- CSV export of the current filtered view
- Paginated — 20 records per page

#### Reception Workflow
- Every approval/rejection is stamped with the staff member's name, role, timestamp, and optional notes
- Admin and Manager see a "Processed By" column showing who handled each booking
- Bookings are **never deleted** — cancelled bookings stay in history with a cancellation note

#### Hotel Services Management
- Add, edit, delete, and show/hide any service
- Fields: name, category, emoji icon, price, price label, hours, location, sort order
- Changes reflect immediately on the public Services page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Socket.io-client |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | PostgreSQL |
| Real-Time | Socket.io (live room status updates) |
| Email | Nodemailer (SMTP — optional) |
| Styling | CSS3 (Flexbox / Grid, no UI framework) |

---

## Project Structure

```
Hotel Boking/
├── backend/
│   ├── config/
│   │   └── database.js          # Sequelize connection
│   ├── controllers/
│   │   ├── bookingController.js  # Booking CRUD, history, decisions, loyalty
│   │   ├── serviceController.js  # Hotel services CRUD + seed
│   │   ├── roomController.js
│   │   ├── offerController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   ├── currencyController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT + role guard
│   │   ├── mailer.js            # Nodemailer wrapper
│   │   ├── upload.js            # Room image uploads (Multer)
│   │   └── uploadPayment.js     # Payment proof uploads
│   ├── models/
│   │   ├── Booking.js
│   │   ├── HotelService.js      # Services menu model
│   │   ├── Room.js
│   │   ├── RoomType.js
│   │   ├── User.js
│   │   ├── Offer.js
│   │   ├── Review.js
│   │   ├── ExchangeRate.js
│   │   └── index.js             # Associations
│   ├── routes/
│   │   ├── bookings.js
│   │   ├── services.js
│   │   ├── rooms.js
│   │   ├── auth.js
│   │   ├── offers.js
│   │   ├── payments.js
│   │   ├── reviews.js
│   │   ├── currency.js
│   │   └── analytics.js
│   ├── scripts/
│   │   ├── addReceptionAccounts.js  # Create staff accounts
│   │   ├── cancelBooking.js         # Soft-cancel a single booking
│   │   ├── cancelPending.js         # Soft-cancel all pending bookings
│   │   ├── checkUsers.js            # Inspect user table
│   │   ├── fixReceptionist.js       # Fix role issues
│   │   ├── resetPasswords.js        # Reset staff passwords
│   │   └── seedUsers.js             # Seed demo accounts
│   ├── socket.js
│   └── server.js                # Entry point — sync DB, seed, start server
└── frontend/
    └── src/
        ├── components/
        │   ├── AdminPanel.js     # Staff portal (all tabs)
        │   ├── Services.js       # Public services menu page
        │   ├── BookingForm.js    # Availability → room select → booking
        │   ├── Rooms.js          # Public room gallery
        │   ├── Amenities.js
        │   ├── AvailabilitySearch.js
        │   ├── PaymentForm.js
        │   ├── ReviewForm.js
        │   ├── RoomSlideshow.js
        │   └── Footer.js
        ├── styles/
        │   ├── AdminPanel.css
        │   └── Services.css
        ├── CurrencyContext.js
        ├── LanguageContext.js
        ├── api.js
        └── App.js
```

---

## Setup

### Prerequisites
- Node.js v16+
- PostgreSQL running locally

### 1. Clone
```bash
git clone https://github.com/Micheyas/Hotel-Boking-Sistem.git
cd Hotel-Boking-Sistem
```

### 2. Backend
```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_booking
DB_USER=postgres
DB_PASS=your_postgres_password

JWT_SECRET=your_secret_key
PORT=5000

# Optional — email notifications
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional — currency API
EXCHANGE_API_KEY=your_key
```

Start the backend:
```bash
npm start
```

On first run the server will:
1. Sync the database schema (create all tables)
2. Seed 3 default room types and 23 rooms
3. Seed 22 default hotel services across 6 categories

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000`

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@hotel.com | admin123 |
| Manager | manager@hotel.com | manager123 |
| Receptionist | receptionist@hotel.com | receptionist123 |
| Customer | customer@hotel.com | customer123 |

To add more receptionist accounts:
```bash
cd backend
node scripts/addReceptionAccounts.js
```

---

## API Overview

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Register customer |
| GET | `/api/rooms/public` | Public | All rooms |
| GET | `/api/rooms/check-availability` | Public | Available rooms for dates |
| POST | `/api/bookings/guest` | Public | Guest booking |
| GET | `/api/bookings` | Staff | All bookings |
| GET | `/api/bookings/history` | Staff | Filtered + paginated history |
| POST | `/api/bookings/:id/decision` | Staff | Approve / reject |
| GET | `/api/bookings/repeat-customers` | Admin, Receptionist | Repeat customers |
| GET | `/api/services` | Public | Active hotel services |
| POST | `/api/services` | Admin, Manager | Create service |
| PUT | `/api/services/:id` | Admin, Manager | Update service |
| DELETE | `/api/services/:id` | Admin | Delete service |
| PUT | `/api/payments/:id/verify-proof` | Staff | Verify payment screenshot |

Full endpoint documentation: see `API_DOCUMENTATION.md`

---

## Data Safety

- **Bookings are never hard-deleted.** Cancellations set `status = 'cancelled'` and write an audit note to `receptionNotes`. The full history is always preserved.
- The auto-expiry cleanup (pending bookings older than 5 minutes with no payment) cancels rather than deletes.
- `.env` is excluded from git — never commit real credentials.

---

## License

MIT License — © 2026 2RN Solomon
