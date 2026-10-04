// Allowed frontend origins for CORS (Express + Socket.io).
// Configure via env:
//   FRONTEND_URL  — primary frontend URL (already in .env.example)
//   CORS_ORIGIN   — extra comma-separated origins, e.g. "https://staging.example.com,https://x.vercel.app"
// Defaults always include the production Vercel app and the local CRA dev server.
const origins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : []),
  'https://hotel-boking-sistem.vercel.app',
  'http://localhost:3000',
].filter(Boolean);

module.exports = [...new Set(origins)];
