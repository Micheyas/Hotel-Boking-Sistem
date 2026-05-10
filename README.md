# Hotel Booking Management System

A modern, full-stack hotel booking platform featuring a streamlined "Check Availability" workflow, individual room management, and a powerful admin dashboard.

## 🚀 Key Features

- ✅ **Availability-First Flow** - Guests must check availability (dates & guests) before booking.
- ✅ **Individual Room Booking** - List and book specific physical rooms (e.g., Room 101) with unique images and details.
- ✅ **Advanced Admin Panel** - Full-screen room management with drag-and-drop image uploads and amenity selection.
- ✅ **Multi-Currency Support** - Real-time conversion between ETB (Base), USD, GBP, and EUR.
- ✅ **Real-Time Updates** - WebSocket-powered live room status and booking notifications.
- ✅ **Secure Payments** - Integrated Stripe payment gateway with proof-of-payment verification.
- ✅ **Analytics Dashboard** - Visualize occupancy rates, revenue, and booking trends.
- ✅ **Guest Reviews** - 5-star rating system with comments for every room.
- ✅ **Email Notifications** - Automated booking confirmations and status updates.

## 📁 Project Structure

```
Hotel Boking/
├── backend/
│   ├── controllers/         # Logic for bookings, rooms, analytics, etc.
│   ├── middleware/          # Auth, file uploads (Multer), and mailer (Nodemailer)
│   ├── models/              # Sequelize models (Room, Booking, User, etc.)
│   ├── routes/              # API endpoints
│   ├── socket.js            # WebSocket configuration
│   └── server.js            # App entry point & database sync
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AdminPanel.js         # Comprehensive staff dashboard
    │   │   ├── AvailabilitySearch.js  # Vertical search component
    │   │   ├── BookingForm.js        # Multi-step booking process
    │   │   ├── Rooms.js              # Public room gallery
    │   │   ├── AnalyticsDashboard.js # Data visualizations
    │   │   └── ...                   # Auth, Reviews, FAQ
    │   ├── App.js           # Main routing and layout
    │   └── App.css           # Modern design system
```

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Axios, Socket.io-client
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL
- **Real-Time**: Socket.io
- **Styling**: Modern CSS3 (Glassmorphism, Flexbox/Grid)
- **Email**: Nodemailer (SMTP)
- **Payments**: Stripe API

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL (Running)

### 2. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file (see `.env.example` or use current configs)
4. `npm start` (The server will auto-migrate the database)

### 3. Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm start`
4. Visit `http://localhost:3000`

## 📊 Database Schema Highlights

### Rooms Table
- `roomNumber`: Unique identifier
- `roomTypeId`: Link to category
- `maxGuests`: Capacity
- `roomSize`: e.g., "42 sqm"
- `bedType`: e.g., "King Bed"
- `description`: Detailed room bio
- `amenities`: JSON list of features
- `image`: Primary room photo

### Bookings Table
- `status`: pending | confirmed | checked_in | checked_out | cancelled
- `paymentStatus`: unpaid | proof_submitted | verified
- `totalPrice`: Calculated in ETB

## 🔑 Role-Based Access

- **Admin/Manager**: Full access to rooms, users, analytics, and offers.
- **Receptionist**: Create manual bookings and update guest statuses.
- **Customer**: Browse, check availability, and book online.

## 📝 Future Enhancements

- [ ] Multi-language support (i18n)
- [ ] Calendar view for admin booking management
- [ ] SMS gateway integration
- [ ] Loyalty program and rewards
- [ ] Mobile App (React Native)

## 📄 License

MIT License - Copyright (c) 2026 2RN Solomon