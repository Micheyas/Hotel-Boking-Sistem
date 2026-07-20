# AGENTS.md — Agent instructions for Hotel Booking repo

Purpose: give AI coding agents concise, actionable guidance to implement and review features related to reception workflows, admin/manager controls, booking approvals/rejections, and customer analytics.

Quick facts
- Backend: Node.js + Express (backend/). Key files: [backend/controllers/bookingController.js](backend/controllers/bookingController.js#L1), [backend/models/Booking.js](backend/models/Booking.js#L1), [backend/models/User.js](backend/models/User.js#L1), [backend/routes/bookings.js](backend/routes/bookings.js#L1)
- Frontend: React app (frontend/src). Key UI: [frontend/src/components/AdminPanel.js](frontend/src/components/AdminPanel.js#L1)
- DB: Sequelize models in `backend/models`.
- Run (root): `npm install` and `npm start` for frontend/backend separately (see package.json files).

## ✅ Completed Features

### 1. Reception Workflow (Receptionists approve/reject bookings)
- Receptionists can approve or reject pending bookings
- Each decision is tracked with `processedBy`, `processedAction`, `processedAt`, `receptionNotes`
- Admin/Manager can see who approved/rejected each booking
- Live filtering and decision tracking in AdminPanel

### 2. Repeat Customer Detection (Admin Only)
- New endpoint: `GET /bookings/repeat-customers` — admin only
- Groups all bookings by guest email/user
- Returns customers with 2+ bookings
- Includes: name, email, total bookings, total spent, first/last booking dates
- UI tab "🔄 Repeat Customers" visible only to admins
- Admin can review high-value returning customers for loyalty programs

Files for repeat customers feature
- [backend/controllers/bookingController.js](backend/controllers/bookingController.js#L1) — `getRepeatCustomers()` function
- [backend/routes/bookings.js](backend/routes/bookings.js#L1) — `GET /repeat-customers` route (admin only)
- [frontend/src/components/AdminPanel.js](frontend/src/components/AdminPanel.js#L1) — Repeat Customers view tab and table

Implementation notes
- Repeat customers endpoint aggregates data in-memory (not DB query) — suitable for hotels with <5000 bookings
- For larger datasets, consider adding a database index on (guestEmail, createdAt) and pre-computing stats
- Feature is intentionally admin-only to prevent manager/receptionist access per requirements
- Next steps: loyalty program integration, email campaigns for repeat customers

Testing tips
- Create 3+ bookings for the same guest via guest booking or manual booking as receptionist
- Login as admin, navigate to "🔄 Repeat Customers" tab
- Verify customer appears with correct counts and spending totals
- Verify managers/receptionists don't see the tab

### 3. Booking History (All Staff Roles)
- New endpoint: `GET /bookings/history` — accessible to admin, manager, and receptionist
- Supports server-side filtering by: free-text search, status, bookingType, paymentStatus, check-in date range
- Supports server-side sorting on: id, checkInDate, checkOutDate, totalPrice, createdAt (ASC/DESC)
- Paginated — 20 records per page, returns `total`, `page`, `totalPages`, and a `stats` summary object
- Stats object includes: total count, revenue (non-cancelled), counts by status, counts by booking type
- UI tab "📋 Booking History" visible to all staff roles (admin, manager, receptionist)
- Filter bar: live search, status dropdown, booking type dropdown, payment status dropdown, check-in date range, reset button
- Table columns are sortable; clicking a column header toggles ASC/DESC
- Each row has an expand button (▼) revealing full detail: phone, nights, booked-on timestamp, processed-at, reception notes, payment proof thumbnail
- Export button generates a CSV download of the current filtered/paginated page
- Stats strip above the table shows live counts and revenue for the active filter set

Files for booking history feature
- [backend/controllers/bookingController.js](backend/controllers/bookingController.js#L1) — `getBookingHistory()` function
- [backend/routes/bookings.js](backend/routes/bookings.js#L1) — `GET /history` route (all staff roles)
- [frontend/src/components/AdminPanel.js](frontend/src/components/AdminPanel.js#L1) — Booking History tab, state, helpers, and full JSX view
- [frontend/src/styles/AdminPanel.css](frontend/src/styles/AdminPanel.css#L1) — all `.bh-*` CSS rules

Query parameters for `GET /bookings/history`
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | `''` | Matches name, email, phone, room number, booking ID |
| `status` | string | `''` | pending / confirmed / checked_in / checked_out / cancelled |
| `bookingType` | string | `''` | online / manual / guest |
| `paymentStatus` | string | `''` | unpaid / proof_submitted / verified |
| `dateFrom` | ISO date | `''` | Filter check-in date ≥ this value |
| `dateTo` | ISO date | `''` | Filter check-in date ≤ this value |
| `sortBy` | string | `createdAt` | Column to sort by |
| `sortDir` | string | `DESC` | ASC or DESC |
| `page` | number | `1` | Page number |
| `limit` | number | `25` | Records per page (max 100) |

Implementation notes
- Search is applied in-memory after DB fetch; suitable for hotels with <5000 bookings. For larger datasets, move search into the Sequelize `where` clause with `Op.iLike` and add DB indexes on `guestName`, `guestEmail`, `guestPhone`.
- The `stats` object in the response is computed from the full filtered set before pagination, so it always reflects totals for the current filter — not just the current page.
- CSV export only covers the currently loaded page; to export all, increase `limit` to 100 first.

Testing tips
- Login as any staff role (admin, manager, or receptionist) and navigate to "📋 Booking History"
- Verify all three roles can see and use the tab
- Use the search box to find a booking by guest name, email, room number, or booking ID
- Apply status and date range filters and confirm the stats strip updates accordingly
- Click a column header to sort; click again to reverse direction
- Click ▼ on any row to expand and see full booking details
- Click "⬇ Export CSV" and verify a .csv file downloads with correct data
- Verify pagination appears when there are more than 20 bookings
