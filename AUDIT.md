# Hotel-Boking-Sistem — Audit Report (2026-10-04)

Static audit + repo hygiene. No application code was changed; no `npm install` was run.

## Stack

- **Frontend:** React 18 + react-router-dom 6, axios, socket.io-client, react-scripts 5 (CRA). Lives in `frontend/`, deployed on Vercel (`hotel-boking-sistem.vercel.app`).
- **Backend:** Node.js + Express 4, Sequelize 6 + Postgres (`pg`), Socket.io 4, JWT (`jsonwebtoken`), bcryptjs, multer (+ multer-storage-cloudinary), Cloudinary, Stripe v12, nodemailer, google-auth-library. Lives in `backend/`, runs on Render/Railway (`server.js` pings itself every 14 min to stay awake on Render free tier).
- **DB:** Postgres 15 via docker-compose (local dev). `sequelize.sync({ alter: false })` + manual `addColumnIfMissing` migrations at startup in `server.js` (no migration files).
- **Frontend ↔ backend:** REST (`REACT_APP_API_URL`, axios instance in `frontend/src/api.js` with staff/customer token interceptor) + Socket.io for realtime (`roomsUpdated` events etc.).

## Route / feature inventory

**Backend API (`backend/routes/`):** auth, rooms, bookings, offers, currency, payments, analytics, reviews, services, menu — 10 routers.
Key endpoints: reception approve/reject bookings, `GET /bookings/repeat-customers` (admin), `GET /bookings/history` (all staff, filter/sort/paginate/CSV), KYC submit/review, payment-proof upload, Stripe, currency conversion, menu/services/offers CRUD.

**Frontend pages (`frontend/src/App.js`):** `/` Home, `/booking`, `/rooms`, `/services`, `/amenities`, `/reviews`, `/reviews/:roomId`, `/verify-email`, `/login`, `/register`, `/profile-setup`, `/admin` (AdminPanel — staff portal), `/payment`.
Components: AdminPanel, AvailabilitySearch, BookingForm, CustomerAuth, PaymentForm, ReviewForm/Page, RoomSlideshow, Rooms, Services, Toast, ProfileSetup, VerifyEmailPage, Footer. Bilingual EN/Amharic via LanguageContext; multi-currency via CurrencyContext.

## Bugs / issues found (static)

1. **🔴 `NODE_TLS_REJECT_UNAUTHORIZED = '0'` in `backend/server.js:7`** — disables TLS certificate verification globally, marked "for development" but unconditional. MITM risk in production. Should be removed or gated behind `NODE_ENV !== 'production'`.
2. **🔴 `/uploads` served statically with no auth (`server.js`)** — payment proofs and KYC ID documents are reachable by anyone who guesses the timestamped filename. Should require auth or use signed Cloudinary URLs.
3. **🟠 Wide-open CORS** — `app.use(cors())` in `server.js` and `origin: '*'` in `socket.js`. Should restrict to the frontend origin(s).
4. **🟠 No rate limiting on auth endpoints** (`routes/auth.js` — login/register). Brute-force risk. Recommend `express-rate-limit`.
5. **🟡 `JWT_SECRET` has no fallback/default** — `jwt.sign`/`jwt.verify` will throw if unset (fail-closed, acceptable) but it MUST be in env or the app can't start auth. Documented below.
6. **🟡 `sequelize.sync({ alter: false })` + ad-hoc `addColumnIfMissing`** — works but is not a real migration system; schema drift risk across environments. Consider proper migrations later.
7. ✅ **No broken relative `require()`s** in backend (checked programmatically).
8. ✅ Passwords hashed with bcryptjs (10 rounds) in `routes/auth.js`.
9. ✅ Every route file uses `authenticateToken`; analytics restricted to admin/manager/receptionist.

## Env vars needed

**Backend** (`backend/.env.example` is complete and accurate): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `JWT_SECRET` (required, no default), `PORT`, `EXCHANGE_API_KEY`, `EMAIL_SERVICE/EMAIL_USER/EMAIL_PASS`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `RENDER_EXTERNAL_URL` (optional, keep-alive).

**Frontend:** `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

**Note on `frontend/.env.production`:** it is committed and contains the REAL production backend URL (https) + `DISABLE_ESLINT_PLUGIN=true`. These are not credentials (no key to rotate), but the backend URL is now public knowledge since the repo is public. Left the file untouched per instructions; recommend moving the URL to Vercel dashboard env vars and deleting the file from git later.

## Cleanup performed (commit `6243d9e`, pushed to `main`)

- Removed `backend/node_modules` from git tracking — **8,347 files** (`git rm -r --cached`).
- Removed 4 committed payment-proof PNGs from `backend/uploads/payments/` (guest PII — payment screenshots) from tracking AND disk; added `backend/uploads/.gitkeep` to preserve the folder.
- `.gitignore` hardening:
  - root: added `.env.production` (was not covered by existing patterns).
  - `backend/.gitignore` (was empty): node_modules, .env*, uploads/, image/pdf/log globs.
  - `frontend/.gitignore` (was empty): node_modules, build/, .env.local, .env.production, logs.
- Tracked files: **8464 → 116**. No application code modified.

## Recommended next steps (not done)

1. Fix the 4 security items above (TLS verify, uploads auth, CORS, rate limiting).
2. Decide on `frontend/.env.production` — move URL to Vercel env vars, `git rm` the file.
3. White-label the "2RN Solomon" branding for resale; add telebirr/Chapa payments (currently proof-upload only).
