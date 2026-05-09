# Hotel Booking Management System - Quick Start Guide

## Option 1: Using Docker (Recommended for quick setup)

### Prerequisites
- Docker & Docker Compose installed

### Steps

1. **Start PostgreSQL Database**
   ```bash
   docker-compose up -d postgres
   ```
   - Database: `hotel_booking`
   - User: `hb_user`
   - Password: `hb_password`
   - Host: `localhost:5432`

2. **Update Backend .env**
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hotel_booking
   DB_USER=hb_user
   DB_PASS=hb_password
   JWT_SECRET=your_secret_key_here
   PORT=5000
   ```

3. **Start Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Server runs on: `http://localhost:5000`

4. **Start Frontend App** (in another terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on: `http://localhost:3000`

5. **Access Adminer** (optional, for database visualization)
   ```
   http://localhost:8080
   ```

---

## Option 2: Manual PostgreSQL Setup

### Prerequisites
- PostgreSQL 13+ installed locally
- Node.js 16+

### Steps

1. **Create Database**
   ```sql
   CREATE DATABASE hotel_booking;
   CREATE USER hb_user WITH PASSWORD 'hb_password';
   ALTER ROLE hb_user SET client_encoding TO 'utf8';
   ALTER ROLE hb_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE hb_user SET default_transaction_deferrable TO on;
   ALTER ROLE hb_user SET default_transaction_read_only TO off;
   GRANT ALL PRIVILEGES ON DATABASE hotel_booking TO hb_user;
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Frontend Setup** (new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## Test the Application

### 1. Register a New Account
- Go to `http://localhost:3000/register`
- Fill in name, email, password
- Click "Register"

### 2. Login
- Go to `http://localhost:3000/login`
- Use the credentials from registration
- Click "Login"

### 3. Book a Room
- Click "Book Room" in navigation
- Select a room type
- Choose check-in and check-out dates
- Select currency (ETB, USD, GBP, EUR)
- Click "Book Now"

### 4. View Dashboard
- Click "Dashboard" to see your bookings
- View booking history and status

### 5. Admin Panel (Admin/Manager Only)
- Click "Admin Panel"
- Manage all bookings
- View and manage active offers

---

## Default Test Credentials

### Admin User
- Email: `admin@hotel.com`
- Password: `admin123`
- Role: Admin

### Manager User
- Email: `manager@hotel.com`
- Password: `manager123`
- Role: Manager

### Receptionist User
- Email: `receptionist@hotel.com`
- Password: `receptionist123`
- Role: Receptionist

**Note**: You'll need to seed these users in the database first or register them manually.

---

## Database Seeding (Optional)

To populate sample data, run:
```bash
cd backend
node scripts/seed.js
```

---

## Troubleshooting

### Backend not connecting to database
- Check if PostgreSQL is running
- Verify .env variables match your database config
- Ensure database `hotel_booking` exists

### Frontend showing CORS errors
- Make sure backend is running on `http://localhost:5000`
- Check that CORS middleware is enabled in server.js

### Port already in use
- Backend: Change `PORT` in `.env`
- Frontend: Set `PORT=3001 npm start`

### npm install fails
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again
- If issue persists, check Node.js version (v16+ required)

---

## API Testing

Use Postman or curl to test APIs:

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123","role":"customer"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### Get Active Offers
```bash
curl http://localhost:5000/api/offers/active
```

### Convert Currency
```bash
curl -X POST http://localhost:5000/api/currency/convert \
  -H "Content-Type: application/json" \
  -d '{"price":1000,"fromCurrency":"ETB","toCurrency":"USD"}'
```

---

## Development Tips

- Use React DevTools extension for frontend debugging
- Use Redux DevTools if state management is added
- Check browser console for frontend errors
- Check backend terminal for server errors
- Use Postman for API testing before frontend integration

---

## Next Steps

- [ ] Add payment gateway integration
- [ ] Implement email notifications
- [ ] Add real-time availability
- [ ] Create mobile app
- [ ] Set up automated testing
- [ ] Deploy to production

---

For more information, see [README.md](./README.md)