# Hotel Booking Management System

A full-stack hotel booking platform with online reservations, manual receptionist bookings, room management, and multi-currency support. Base currency is Ethiopian Birr (ETB).

## Features

- ✅ **Online Booking** - Customers can book rooms online with multi-currency display
- ✅ **Manual Booking** - Receptionists can create bookings for walk-in guests
- ✅ **Room Management** - Manage room types, individual rooms, amenities, and pricing
- ✅ **Multi-Currency Support** - Auto-fetched exchange rates (USD, GBP, EUR, ETB)
- ✅ **Role-Based Access** - Admin, Manager, Receptionist, and Customer permissions
- ✅ **Booking Management** - View, update status, and manage all bookings
- ✅ **Hotel Offers** - Create and manage promotional offers with eligibility rules
- ✅ **Dashboard** - Statistics and recent activity overview

## Project Structure

```
Hotel Boking/
├── backend/
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── currencyController.js
│   │   ├── offerController.js
│   │   └── roomController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Booking.js
│   │   ├── ExchangeRate.js
│   │   ├── Offer.js
│   │   ├── Room.js
│   │   ├── RoomType.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── currency.js
│   │   ├── offers.js
│   │   └── rooms.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AdminPanel.js
    │   │   ├── BookingForm.js
    │   │   ├── Dashboard.js
    │   │   ├── Login.js
    │   │   └── Register.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    └── package.json
```

## Tech Stack

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: PostgreSQL (with Sequelize ORM)
- **Authentication**: JWT + bcryptjs
- **Validation**: Built-in Express middleware

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS3 with responsive design

## Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL (running locally)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_booking
DB_USER=your_username
DB_PASS=your_password
JWT_SECRET=your_jwt_secret
PORT=5000
EXCHANGE_API_KEY=your_api_key
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Rooms
- `GET /api/rooms/types` - Get all room types
- `GET /api/rooms/available` - Get available rooms for date range
- `GET /api/rooms` - Get all rooms (admin)
- `POST /api/rooms/types` - Create room type (admin)
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:roomId/status` - Update room status

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings` - Get all bookings (admin)
- `PUT /api/bookings/:bookingId/status` - Update booking status
- `PUT /api/bookings/:bookingId/cancel` - Cancel booking

### Offers
- `GET /api/offers/active` - Get active offers
- `POST /api/offers/calculate-discount` - Calculate discount for offer
- `GET /api/offers` - Get all offers (admin)
- `POST /api/offers` - Create offer (admin)
- `PUT /api/offers/:offerId/status` - Update offer status (admin)

### Currency
- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert price between currencies
- `POST /api/currency/rates/update` - Update exchange rates (admin)

## Database Schema

### Users Table
- id, name, email, password, role (admin|manager|receptionist|customer), createdAt, updatedAt

### RoomTypes Table
- id, name, description, basePrice, amenities (JSON), createdAt, updatedAt

### Rooms Table
- id, roomNumber, roomTypeId (FK), status (available|occupied|maintenance), floor, createdAt, updatedAt

### Bookings Table
- id, userId (FK), roomId (FK), checkInDate, checkOutDate, totalPrice, status (pending|confirmed|checked_in|checked_out|cancelled), bookingType (online|manual), createdAt, updatedAt

### Offers Table
- id, name, description, promoCode, discountType (percentage|fixed), discountValue, minNights, startDate, endDate, status (active|inactive), createdBy (FK), createdAt, updatedAt

### ExchangeRates Table
- id, baseCurrency, targetCurrency, rate, lastUpdated

## Role-Based Access Control

### Customer
- Register & login
- Browse available rooms
- Make online bookings
- View own bookings
- Cancel own bookings

### Receptionist
- View all bookings
- Create manual bookings
- Update booking status
- View available rooms

### Manager
- All receptionist permissions
- Create & manage room types
- Create & manage offers
- View booking statistics

### Admin
- All permissions
- User management
- System settings
- Exchange rate management

## Multi-Currency Support

Supported currencies:
- ETB (Ethiopian Birr) - Base currency
- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)

Exchange rates are stored in the database and can be updated via API.

## Hotel Offers Module

Supports multiple offer types:
- **Seasonal Discounts** - Percentage or fixed amount off
- **Early Bird Deals** - Discount for advance bookings
- **Stay More, Pay Less** - Discounts based on length of stay
- **Last-Minute Deals** - Reduced rates for soon arrivals
- **Promo Codes** - Custom promotional codes

## Running the Application

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend (in another terminal)
```bash
cd frontend
npm start
```

### Test the System
1. Register a new account at `http://localhost:3000/register`
2. Login with your credentials
3. Browse available rooms and make a booking
4. View booking history in dashboard
5. Access admin panel (if admin/manager role)

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Email notifications for bookings
- [ ] SMS notifications
- [ ] Hotel location map display
- [ ] Real-time room availability
- [ ] Guest reviews and ratings
- [ ] Loyalty program points
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Calendar view for bookings

## License

MIT License

## Support

For support, please contact support@hotelbooking.com