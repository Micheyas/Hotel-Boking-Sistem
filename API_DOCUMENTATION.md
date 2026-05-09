# Hotel Booking API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### Register User
```
POST /auth/register
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer"
}
```

**Response:**
```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Login User
```
POST /auth/login
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

**Note:** Use the token in the Authorization header for protected routes:
```
Authorization: Bearer <token>
```

---

## Rooms

### Get All Room Types
```
GET /rooms/types
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Standard Room",
    "description": "Basic comfortable room",
    "basePrice": 2000,
    "amenities": ["WiFi", "AC", "TV"]
  }
]
```

### Get Available Rooms
```
GET /rooms/available?checkInDate=2026-05-15&checkOutDate=2026-05-17
```
**Response:**
```json
[
  {
    "id": 1,
    "roomNumber": "101",
    "roomTypeId": 1,
    "floor": 1,
    "status": "available"
  }
]
```

### Get All Rooms (Admin/Manager)
```
GET /rooms
Authorization: Bearer <token>
```

### Create Room Type (Admin/Manager)
```
POST /rooms/types
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "Deluxe Room",
  "description": "Spacious room with premium amenities",
  "basePrice": 3500,
  "amenities": ["WiFi", "AC", "Smart TV", "Mini Bar"]
}
```

### Create Room (Admin/Manager)
```
POST /rooms
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "roomNumber": "201",
  "roomTypeId": 2,
  "floor": 2
}
```

### Update Room Status (Admin/Manager/Receptionist)
```
PUT /rooms/:roomId/status
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "occupied"
}
```

---

## Bookings

### Create Booking (Customer)
```
POST /bookings
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "roomId": 1,
  "checkInDate": "2026-05-15",
  "checkOutDate": "2026-05-17",
  "totalPrice": 4000
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "roomId": 1,
  "checkInDate": "2026-05-15",
  "checkOutDate": "2026-05-17",
  "totalPrice": 4000,
  "status": "pending",
  "bookingType": "online"
}
```

### Get User Bookings
```
GET /bookings/my-bookings
Authorization: Bearer <token>
```

### Get All Bookings (Admin/Manager/Receptionist)
```
GET /bookings
Authorization: Bearer <token>
```

### Update Booking Status (Admin/Manager/Receptionist)
```
PUT /bookings/:bookingId/status
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Available Statuses:** `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`

### Cancel Booking (Customer)
```
PUT /bookings/:bookingId/cancel
Authorization: Bearer <token>
```

---

## Offers

### Get Active Offers (Public)
```
GET /offers/active
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Early Bird Discount",
    "description": "Book 7 days in advance and save 15%",
    "promoCode": "EARLYBIRD15",
    "discountType": "percentage",
    "discountValue": 15,
    "minNights": 3,
    "startDate": "2026-05-09",
    "endDate": "2026-06-08",
    "status": "active"
  }
]
```

### Calculate Discount
```
POST /offers/calculate-discount
```
**Request Body:**
```json
{
  "offerId": 1,
  "price": 4000,
  "nights": 3
}
```

**Response:**
```json
{
  "originalPrice": 4000,
  "discountAmount": 600,
  "finalPrice": 3400
}
```

### Get All Offers (Admin/Manager)
```
GET /offers
Authorization: Bearer <token>
```

### Create Offer (Admin)
```
POST /offers
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "New Promotion",
  "description": "Special discount for holidays",
  "promoCode": "HOLIDAY20",
  "discountType": "percentage",
  "discountValue": 20,
  "minNights": 2,
  "startDate": "2026-05-15",
  "endDate": "2026-06-15"
}
```

### Update Offer Status (Admin)
```
PUT /offers/:offerId/status
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "status": "inactive"
}
```

---

## Currency

### Get Exchange Rates (Public)
```
GET /currency/rates
```
**Response:**
```json
[
  {
    "id": 1,
    "baseCurrency": "ETB",
    "targetCurrency": "USD",
    "rate": 0.0088,
    "lastUpdated": "2026-05-09"
  }
]
```

### Convert Price (Public)
```
POST /currency/convert
```
**Request Body:**
```json
{
  "price": 1000,
  "fromCurrency": "ETB",
  "toCurrency": "USD"
}
```

**Response:**
```json
{
  "originalPrice": 1000,
  "fromCurrency": "ETB",
  "convertedPrice": 8.8,
  "toCurrency": "USD"
}
```

### Update Exchange Rates (Admin)
```
POST /currency/rates/update
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Exchange rates updated",
  "rates": {
    "USD": 0.0088,
    "GBP": 0.0070,
    "EUR": 0.0082
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Example Workflows

### Complete Booking Workflow

1. **Register/Login**
   ```bash
   POST /auth/login
   ```
   Get token from response

2. **Browse Available Rooms**
   ```bash
   GET /rooms/types
   GET /rooms/available?checkInDate=2026-05-15&checkOutDate=2026-05-17
   ```

3. **Check Active Offers**
   ```bash
   GET /offers/active
   ```

4. **Calculate Discount**
   ```bash
   POST /offers/calculate-discount
   ```

5. **Create Booking**
   ```bash
   POST /bookings
   Authorization: Bearer <token>
   ```

6. **View Booking**
   ```bash
   GET /bookings/my-bookings
   Authorization: Bearer <token>
   ```

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Room Types
```bash
curl http://localhost:5000/api/rooms/types
```

### Convert Currency
```bash
curl -X POST http://localhost:5000/api/currency/convert \
  -H "Content-Type: application/json" \
  -d '{
    "price": 2000,
    "fromCurrency": "ETB",
    "toCurrency": "USD"
  }'
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production use.