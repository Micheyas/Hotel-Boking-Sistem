# Hotel Booking System - Complete Features Guide

## 📋 Table of Contents
1. [Core Booking Features](#core-booking-features)
2. [Advanced Features](#advanced-features)
3. [Admin Features](#admin-features)
4. [Real-Time Features](#real-time-features)

---

## Core Booking Features

### 1. Online Room Booking

**How to Book:**
1. Login to your account (or register if new)
2. Click "Book Room" in the navigation
3. Select room type from dropdown
4. Choose check-in and check-out dates
5. Select your preferred currency (ETB, USD, GBP, EUR)
6. Review the total price
7. Click "Book Now"

**What Happens:**
- Room is reserved for your dates
- Booking confirmation email is sent
- Booking appears in your dashboard
- Status starts as "pending"

**Example Workflow:**
```
User: John Doe
Room: Deluxe Room
Check-in: 2026-05-15
Check-out: 2026-05-17
Total: 4,000 ETB (≈ 10.5 USD)
↓
Confirmation email sent to john@example.com
↓
Booking created with status: "pending"
```

### 2. Multi-Currency Support

**Available Currencies:**
- ETB (Ethiopian Birr) - Base currency
- USD (US Dollar)
- GBP (British Pound)
- EUR (Euro)

**How it Works:**
- Select currency before booking
- Price automatically converts using live exchange rates
- Booking price stored in ETB (base)
- Display price in selected currency

**Example:**
```
Room base price: 2,000 ETB
If selecting USD: 2,000 ETB × 0.0088 = 17.60 USD
If selecting GBP: 2,000 ETB × 0.0070 = 14.00 GBP
If selecting EUR: 2,000 ETB × 0.0082 = 16.40 EUR
```

### 3. Promotional Offers

**How Offers Work:**
1. Browse available offers on booking page
2. Offers show discount type (percentage or fixed amount)
3. Offer codes apply automatically if eligible
4. See discount amount before confirming booking

**Example Offers:**
```
Offer 1: "Early Bird 15%" 
- Type: Percentage discount
- Discount: 15% off
- Requirements: Book 7 days in advance, min 3 nights
- Promo Code: EARLYBIRD15

Offer 2: "Holiday Special"
- Type: Fixed discount
- Discount: 500 ETB off
- Requirements: Valid during holiday period
- Promo Code: HOLIDAY20
```

**Discount Calculation:**
```
Original price: 6,000 ETB
Offer: 15% percentage discount
Discount amount: 6,000 × 0.15 = 900 ETB
Final price: 6,000 - 900 = 5,100 ETB
```

---

## Advanced Features

### 1. 💳 Stripe Payment Integration

**Purpose:**
- Secure online payment processing
- PCI compliance handled by Stripe
- Multiple payment methods supported

**How to Pay:**
1. Complete booking form
2. Click "Proceed to Payment"
3. Review booking details
4. Click "Pay with Stripe"
5. You're redirected to secure Stripe checkout page
6. Enter payment details or use saved payment method
7. Confirm payment

**Test Cards (Development Mode):**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Authentication: 4000 0025 0000 3155

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Billing ZIP: Any value (e.g., 12345)
```

**What Happens After Payment:**
- ✅ Payment confirmed by Stripe
- ✅ Booking status changes to "confirmed"
- ✅ Confirmation email sent
- ✅ Payment receipt generated

**Payment Flow:**
```
User initiates payment
↓
Stripe checkout session created
↓
User redirected to Stripe hosted page
↓
User enters payment details securely
↓
Stripe processes payment
↓
Webhook notifies backend (future enhancement)
↓
Booking status updated to "confirmed"
```

### 2. 📧 Email Notifications

**When Emails Are Sent:**

**Booking Confirmation**
- Sent: Immediately after booking creation
- To: Guest's email address
- Contains: Booking details, room info, dates, total price

**Example Email:**
```
Subject: Hotel Booking Confirmation - Booking #123

Dear Guest,

Your booking has been confirmed!

Booking Details:
- Booking ID: #123
- Room: Deluxe Room (101)
- Check-in: 2026-05-15
- Check-out: 2026-05-17
- Total Price: 4,000 ETB
- Status: Pending Payment

Thank you for choosing our hotel!
```

**Status Update Emails** (Automatic)
- Sent when booking status changes
- Examples: confirmed, checked in, checked out, cancelled

**Setup Instructions:**
```
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your setup)
3. Generate app password
4. Copy and add to .env:
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=generated_app_password
```

### 3. 🔄 Real-Time Availability (WebSocket)

**How It Works:**
- Server broadcasts room status changes to all connected clients
- No page refresh needed
- Updates appear instantly for multiple users

**Room Statuses:**
- 🟢 **Available** - Room can be booked
- 🔴 **Occupied** - Guest currently checked in
- 🟡 **Maintenance** - Room under maintenance

**Real-Time Updates Include:**
- When a room becomes available
- When a room is occupied
- When a room status changes
- When inventory updates

**Example Scenario:**
```
Time 10:00 AM:
- Manager marks Room 101 as "maintenance"
- All connected users see: Room 101 status → Maintenance (instantly)
- No page refresh needed
- Room automatically hidden from booking options

Time 11:30 AM:
- Maintenance completes, manager marks "available"
- All users immediately see: Room 101 is available again
- Users can book it instantly
```

### 4. ⭐ Guest Review & Rating System

**How to Review:**
1. After staying or visiting a room
2. Go to Reviews section
3. Select the room you want to review
4. Choose rating (1-5 stars)
5. Write optional comment (max 1000 chars)
6. Submit review

**Rating Scale:**
- ⭐ 1 - Poor
- ⭐⭐ 2 - Fair
- ⭐⭐⭐ 3 - Good
- ⭐⭐⭐⭐ 4 - Very Good
- ⭐⭐⭐⭐⭐ 5 - Excellent

**What Others See:**
- Average rating for each room
- Recent reviews with guest names
- Most helpful reviews first
- Average rating calculation updates in real-time

**Example Review:**
```
User: Sarah Johnson
Rating: ⭐⭐⭐⭐⭐ 5 stars
Comment: "Amazing experience! Clean room, great service, 
perfect location. Highly recommend!"

Average room rating now: 4.7/5 (from 15 reviews)
```

**Admin Features:**
- View all reviews system-wide
- Moderate/delete inappropriate reviews (future)
- See review analytics and trends

---

## Admin Features

### 1. 📊 Advanced Analytics Dashboard

**Accessible to:** Admin and Manager roles only

**Metrics Displayed:**

**Total Bookings**
- Count of all bookings in system
- Includes: pending, confirmed, checked-in, checked-out, cancelled

**Total Revenue**
- Sum of all booking prices
- Currency: ETB (Ethiopian Birr)
- Includes: completed and pending bookings

**Occupancy Rate**
- Percentage of rooms occupied
- Calculation: (Occupied Rooms / Total Rooms) × 100
- Updated in real-time
- Example: 75% occupancy = 15 rooms occupied out of 20

**Booking Status Breakdown**
- Visual chart showing bookings by status
- Status categories:
  - Confirmed: Paid bookings
  - Checked-in: Guests currently in rooms
  - Pending: Awaiting payment/confirmation
  - Cancelled: Cancelled bookings

**Example Dashboard:**
```
┌─ ANALYTICS DASHBOARD ─────────────────────┐
│                                           │
│  Total Bookings        Total Revenue      │
│        45              450,000 ETB         │
│                                           │
│  Occupancy Rate      Room Status          │
│      78%             ████████ Confirmed   │
│                      ███ Checked-in       │
│                      ██ Pending           │
│                      ░ Cancelled          │
│                                           │
└───────────────────────────────────────────┘
```

**Use Cases:**
- Monitor business performance
- Identify peak booking periods
- Track revenue trends
- Make pricing decisions
- Plan inventory and staffing

### 2. Booking Management

**Admin Panel Features:**
- View all bookings (not just own)
- Search by guest, dates, room
- Update booking status manually
- See full booking details
- Cancel bookings if needed
- Generate reports

**Booking Statuses (Editable):**
- `pending` - Awaiting confirmation
- `confirmed` - Ready for check-in
- `checked_in` - Guest in room
- `checked_out` - Guest departed
- `cancelled` - Booking cancelled

### 3. Offer Management

**Create Promotions:**
1. Go to Admin Panel → Offers
2. Click "Create New Offer"
3. Fill details:
   - Offer name
   - Description
   - Promo code
   - Discount type (percentage or fixed)
   - Discount value
   - Minimum nights required
   - Valid date range

**Example Offers You Can Create:**
```
Offer 1: Weekend Special
- 20% off for weekends
- Minimum 1 night
- Valid May-June 2026

Offer 2: Group Discount
- 500 ETB off per room
- Minimum 3 rooms booked
- Valid all year

Offer 3: Early Bird
- 15% off bookings made 7+ days in advance
- Minimum 3 nights
- Valid all year
```

---

## Real-Time Features

### 1. Live Room Status Updates

**What Updates in Real-Time:**
- Room availability changes
- Room status changes (available → occupied → maintenance)
- New bookings for rooms
- Cancellations

**How It Works:**
```
Backend Service (Socket.io)
    ↓
Broadcasts event: "roomStatusChanged"
    ↓
All Connected Clients
    ↓
UI Updates Immediately (No Refresh)
```

**Example:**
```
Manager checks Room 101 as "occupied"
↓
Within milliseconds, all connected users see:
"Room 101 is now occupied"
↓
System automatically hides it from booking options
↓
Other users don't need to refresh
```

### 2. Live Metrics Updates

**Dashboard Updates:**
- Occupancy rate changes as bookings occur
- Revenue updates as new bookings confirmed
- Status breakdown updates in real-time

---

## Workflow Examples

### Complete Booking Workflow

```
STEP 1: Browse
├─ User visits site
├─ Views available room types
└─ Selects room to book

STEP 2: Select Details
├─ Choose check-in/check-out dates
├─ Select currency
├─ Review price
└─ See applicable offers

STEP 3: Create Booking
├─ Click "Book Now"
├─ Confirmation email sent
├─ Booking created (status: pending)
└─ Added to dashboard

STEP 4: Payment (Optional)
├─ Click "Pay with Stripe"
├─ Redirected to secure checkout
├─ Enter payment details
├─ Confirm payment
└─ Status changes to "confirmed"

STEP 5: Check-in
├─ Manager updates status to "checked_in"
├─ Real-time notification sent
├─ Status visible on dashboard
└─ Room marked as occupied

STEP 6: Review & Check-out
├─ Guest checks out (status: checked_out)
├─ Guest can submit review
├─ Comment and rating posted
└─ Average rating updates

STEP 7: Analytics
├─ Admin views analytics
├─ Revenue recorded
├─ Occupancy stats updated
└─ Reports generated
```

### Admin Workflow

```
Admin logs in
↓
Views Analytics Dashboard
├─ Total bookings: 45
├─ Revenue: 450,000 ETB
├─ Occupancy: 78%
└─ Status breakdown chart

Manages Bookings
├─ Reviews pending bookings
├─ Updates booking statuses
├─ Handles cancellations
└─ Resolves conflicts

Creates Promotions
├─ Designs new offers
├─ Sets discount rates
├─ Defines date ranges
└─ Activates offers

Monitors Real-Time Updates
├─ Sees room status changes
├─ Receives notifications
├─ Updates inventory
└─ Makes decisions
```

---

## Tips & Best Practices

### For Guests
1. Book early for better availability
2. Check for active offers before booking
3. Provide accurate email for confirmations
4. Leave reviews to help others
5. Use test payment card in development

### For Managers
1. Update room status promptly
2. Monitor analytics daily
3. Create timely offers for peak periods
4. Respond to guest reviews
5. Maintain guest satisfaction

### For Admins
1. Regular database backups
2. Monitor system performance
3. Update exchange rates daily
4. Review analytics trends
5. Manage user permissions

---

## Troubleshooting

**Email Not Received:**
- Check spam folder
- Verify email address is correct
- Confirm EMAIL_PASS is app password (not account password)
- Check email service in .env is set to "gmail"

**Payment Fails:**
- Verify Stripe keys are correct
- Use test card number provided
- Check FRONTEND_URL in .env
- Ensure SSL/HTTPS in production

**Real-Time Updates Not Working:**
- Check if Socket.io port (5000) is open
- Verify token is valid
- Check browser console for connection errors
- Restart server and reconnect

**Reviews Not Loading:**
- Ensure Review table exists in database
- Verify roomId is passed correctly
- Check authentication token
- Review backend logs

**Analytics Shows Wrong Numbers:**
- Run database integrity check
- Verify booking statuses are correct
- Check if all bookings have valid dates
- Refresh analytics page

---

## Support & Documentation

- **API Docs**: See `API_DOCUMENTATION.md`
- **Setup Guide**: See `SETUP.md`
- **Enhancements**: See `ENHANCEMENTS.md`
- **Mobile App**: See `MOBILE_APP.md`

For issues, check the main README.md troubleshooting section.