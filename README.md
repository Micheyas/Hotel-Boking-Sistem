# 2RN Solomon — Hotel Booking System

A full-stack hotel management platform built with React and Node.js. Covers the complete guest journey from availability search to check-out, plus a staff portal for receptionists, managers, admins, and IT support.

---

## Live Demo

- **Frontend (Vercel):** [hotel-boking-sistem.vercel.app](https://hotel-boking-sistem.vercel.app)
- **Backend (Railway/Render):** REST API + Socket.io

---

## Recent Improvements (v2)

### UI & Mobile Experience
- Full **mobile-responsive** design — hamburger drawer menu, stacked search fields, touch-friendly buttons
- **CSS design token system** — all colors, spacing, radius, and shadows use `:root` CSS variables for consistency
- Skeleton loading cards on the rooms page while data loads
- Improved button states, spacing, and premium hotel color palette (navy / gold)

### Loading & Error States
- **Skeleton loaders** on every data fetch (rooms, services, menu)
- **Toast notification system** — success / error / info / warning toasts with auto-dismiss and slide animation
- All form submit buttons show a spinner and are disabled while submitting

### Strengthened File Uploads
- Payment proof and KYC document uploads now validate **file type** (JPG, PNG, WebP, PDF) and **file size** (max 5 MB / 10 MB)
- **Drag-and-drop** upload zone with visual feedback
- Image preview shown immediately after file selection
- Clear error messages for wrong type or oversized files

---

## Features

### Guest-Facing
- **Availability Search** — check dates and guest count before booking
- **Room Gallery** — browse all rooms with photos, amenities, bed type, size, and pricing
- **Online Booking** — logged-in customers book specific rooms with KYC verification
- **Guest Booking** — walk-in/phone guests book without an account
- **Loyalty Discounts** — returning guests receive 5–15% discount based on booking history
- **Payment Proof Upload** — drag-and-drop with file validation, preview before submit
- **Hotel Services Page** — Wellness & Spa, Fitness, Transport, Facilities, Recreation — each with sub-menu items showing photos and prices
- **Restaurant Menu** — full food menu with photos, prices, and category filters
- **Guest Reviews** — 5-star ratings with comments per room
- **Multi-Currency** — live ETB / USD / GBP / EUR conversion
- **Bilingual UI** — English / Amharic toggle (all pages including menus)
- **KYC Identity Verification** — customers submit ID documents before booking; staff review and approve

### Staff Portal (`/admin`)

| Feature | Admin | Manager | Receptionist | IT |
|---|:---:|:---:|:---:|:---:|
| View all bookings | ✅ | ✅ | ✅ | — |
| Approve / Reject bookings | ✅ | ✅ | ✅ | — |
| Override previous decisions | ✅ | ✅ | — | — |
| Payment verification | ✅ | ✅ | ✅ | — |
| Booking History (filters, export) | ✅ | ✅ | ✅ | — |
| Repeat Customer tracking | ✅ | ✅ | ✅ | — |
| Room Management | ✅ | ✅ | — | — |
| Hotel Services Management | ✅ | ✅ | — | — |
| Restaurant Menu Management | ✅ | ✅ | — | — |
| Offers Management | ✅ | ✅ | ✅ | — |
| KYC Verification | ✅ | ✅ | ✅ | — |
| Stats cards (revenue, totals) | ✅ | ✅ | — | — |
| IT Approvals | ✅ | — | — | — |
| IT Management (account requests) | — | — | — | ✅ |

#### Reception Workflow
- Every approval/rejection is stamped with the staff member's name, role, timestamp, and optional notes
- Admin and Manager see a "Processed By" column showing who handled each booking
- Bookings are **never deleted** — cancelled bookings stay in history with an audit note

#### Booking History
- Filter by status, booking type, payment status, check-in date range, and free-text search
- Sortable columns (ID, check-in, check-out, amount, booked-on)
- Expandable rows showing phone, nights, reception notes, payment proof
- CSV export of the current filtered view
- Paginated — 20 records per page

#### Restaurant Menu Management
- Add/edit/delete food items with photo upload (Cloudinary)
- Fields: name, description, photo, price, category, availability toggle
- Items visible on the public Services page immediately

#### IT Role & Admin Approval Workflow
IT staff can submit requests for:
- **Create** — new staff account (admin/manager/receptionist/IT)
- **Reset Password** — reset any staff account password
- **Rename** — change display name and/or login email
- **Delete** — remove a staff account

All IT requests are **pending** until an admin approves or rejects them. Approved actions execute immediately. Full audit trail is kept.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, Socket.io-client |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | PostgreSQL (Neon cloud) |
| File Storage | Cloudinary (room images, payment proofs, KYC docs, menu photos) |
| Real-Time | Socket.io (live room status updates) |
| Email | Nodemailer (SMTP — optional) |
| Auth | JWT, Google OAuth |
| Styling | CSS3 with design tokens (Flexbox / Grid, no UI framework) |

---

## Project Structure

```
Hotel-Boking/
├── backend/
│   ├── config/database.js
│   ├── controllers/
│   │   ├── bookingController.js   # Booking CRUD, history, decisions, loyalty
│   │   ├── menuController.js      # Restaurant + service sub-menu CRUD
│   │   ├── serviceController.js   # Hotel services CRUD + seed
│   │   ├── roomController.js
│   │   ├── offerController.js
│   │   ├── paymentController.js
│   │   ├── reviewController.js
│   │   ├── currencyController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT + role guard
│   │   ├── mailer.js
│   │   ├── upload.js              # Room image uploads (Cloudinary)
│   │   └── uploadPayment.js       # Payment proof uploads
│   ├── models/
│   │   ├── Booking.js
│   │   ├── HotelService.js        # Services with image field
│   │   ├── MenuItem.js            # Food & service sub-menu items
│   │   ├── ITRequest.js           # IT staff account requests
│   │   ├── Room.js
│   │   ├── RoomType.js
│   │   ├── User.js                # Includes KYC fields and IT role
│   │   ├── Offer.js
│   │   ├── Review.js
│   │   ├── ExchangeRate.js
│   │   └── index.js               # All associations
│   ├── routes/
│   │   ├── auth.js                # Auth, KYC, IT requests, admin approvals
│   │   ├── bookings.js
│   │   ├── menu.js
│   │   ├── services.js
│   │   ├── rooms.js
│   │   ├── offers.js
│   │   ├── payments.js
│   │   ├── reviews.js
│   │   ├── currency.js
│   │   └── analytics.js
│   ├── scripts/
│   │   ├── seedUsers.js
│   │   ├── seedMenu.js
│   │   ├── seedServiceMenus.js
│   │   ├── addServiceImages.js
│   │   └── resetStaffPasswords.js
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── AdminPanel.js        # Staff portal (all tabs + IT management)
        │   ├── Services.js          # Public services + menu page
        │   ├── BookingForm.js       # Availability → room select → booking
        │   ├── CustomerAuth.js      # Customer login/register + Google OAuth
        │   ├── ProfileSetup.js      # KYC document submission
        │   ├── PaymentForm.js       # Payment proof upload with drag-drop
        │   ├── Toast.js             # Global toast notification system
        │   ├── Rooms.js             # Public room gallery with skeleton loader
        │   ├── Amenities.js
        │   ├── AvailabilitySearch.js
        │   ├── ReviewForm.js
        │   ├── RoomSlideshow.js
        │   └── Footer.js
        ├── styles/
        │   ├── AdminPanel.css
        │   └── Services.css
        ├── CurrencyContext.js
        ├── LanguageContext.js
        ├── api.js
        └── App.js                   # Hamburger nav, ToastProvider, routing
```

---

## Setup

### Prerequisites
- Node.js v18+
- PostgreSQL (local or cloud — Neon recommended)

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

Create `backend/.env`:
```env
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASS=your_db_password
JWT_SECRET=your_secret_key
PORT=5000

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id

# Optional email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

FRONTEND_URL=https://your-frontend.vercel.app
```

```bash
npm start
```

Seed demo data:
```bash
node scripts/seedUsers.js
node scripts/seedMenu.js
node scripts/seedServiceMenus.js
node scripts/addServiceImages.js
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm start
```

Visit `http://localhost:3000`

---

## Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@hotel.com | admin123 | Full access + IT approvals |
| Manager | manager@hotel.com | manager123 | Most features, no IT |
| Receptionist | receptionist@hotel.com | receptionist123 | Bookings + KYC only |
| IT | it@hotel.com | it123 | IT Management only |

---

## API Overview

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer |
| POST | `/api/auth/login` | Public | Login (any role) |
| POST | `/api/auth/google` | Public | Google OAuth login |
| GET | `/api/auth/kyc/status` | Customer | Get KYC status |
| POST | `/api/auth/kyc` | Customer | Submit KYC documents |
| GET | `/api/auth/admin/kyc` | Staff | List all KYC submissions |
| POST | `/api/auth/admin/kyc/:id` | Staff | Approve/reject KYC |
| POST | `/api/auth/it/request-create` | IT | Request staff account creation |
| POST | `/api/auth/it/request-reset` | IT | Request password reset |
| POST | `/api/auth/it/request-rename` | IT | Request rename / email change |
| POST | `/api/auth/it/request-delete` | IT | Request account deletion |
| GET | `/api/auth/admin/it-requests` | Admin | List IT requests |
| POST | `/api/auth/admin/it-requests/:id/approve` | Admin | Approve IT request |
| POST | `/api/auth/admin/it-requests/:id/reject` | Admin | Reject IT request |
| GET | `/api/rooms/public` | Public | All rooms |
| GET | `/api/rooms/available` | Public | Available rooms for dates |
| POST | `/api/bookings` | Customer | Create online booking |
| POST | `/api/bookings/guest` | Public | Create guest booking |
| POST | `/api/bookings/manual` | Staff | Create manual booking |
| GET | `/api/bookings` | Staff | All bookings |
| GET | `/api/bookings/history` | Staff | Filtered + paginated history |
| POST | `/api/bookings/:id/decision` | Staff | Approve / reject booking |
| GET | `/api/bookings/repeat-customers` | Staff | Repeat customers list |
| GET | `/api/services` | Public | Active hotel services |
| GET | `/api/menu` | Public | Restaurant / service menu items |
| POST | `/api/menu` | Admin, Manager | Create menu item |
| PUT | `/api/menu/:id` | Admin, Manager | Update menu item |
| DELETE | `/api/menu/:id` | Admin | Delete menu item |
| PUT | `/api/payments/:id/verify-proof` | Staff | Verify payment screenshot |
| GET | `/api/reports/dashboard` | Staff | Dashboard metrics |
| GET | `/api/reports/top-products` | Admin, Manager | Top selling items |
| GET | `/api/reports/profit-loss` | Admin, Manager | Profit & loss |

---

## Contact

📞 +251 995 111 015
📱 +251 706 104 273
✉️ info@2rnsolomon.com
📍 Bole Road, Addis Ababa, Ethiopia

---

## Data Safety

- Bookings are **never hard-deleted** — cancellations set `status = 'cancelled'` and write an audit note
- Pending bookings with no payment auto-cancel after 5 minutes (soft cancel, record preserved)
- `.env` is excluded from git — never commit real credentials
- KYC documents are stored on Cloudinary — never on the server filesystem

---

## License

MIT License — © 2026 2RN Solomon Hotel
