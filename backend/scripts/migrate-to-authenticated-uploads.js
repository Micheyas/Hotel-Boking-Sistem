#!/usr/bin/env node
/**
 * ONE-OFF MIGRATION: switch existing Cloudinary documents from public to
 * authenticated delivery.
 * ============================================================================
 * Background
 * ----------
 * Payment proofs (Booking.paymentProof) and KYC ID images (User.idFront /
 * User.idBack) were historically uploaded to Cloudinary with default public
 * (`upload`) delivery, so anyone with the URL could view them forever.
 * New uploads now use `type: 'authenticated'` (see
 * backend/middleware/uploadPayment.js and the KYC storage in
 * backend/routes/auth.js), and staff view them through signed URLs minted by
 * GET /api/staff/documents/signed-url.
 *
 * This script converts the OLD, still-public assets to `authenticated`
 * delivery via the Cloudinary Admin API (`access_mode`), without renaming
 * them and without touching the database: the stored URLs remain valid
 * references — the signed-URL endpoint parses the public_id out of them and
 * works with both `/upload/` and `/authenticated/` URL formats.
 *
 * Usage
 * -----
 *   # Dry run (default): lists every document, its current delivery type,
 *   # and what WOULD change. Makes no changes.
 *   node backend/scripts/migrate-to-authenticated-uploads.js
 *
 *   # Actually apply the migration:
 *   node backend/scripts/migrate-to-authenticated-uploads.js --apply
 *
 * Requirements
 * ------------
 * - Run from the repo root with backend/.env present (needs CLOUDINARY_*
 *   credentials and DB_* connection settings).
 * - Requires Cloudinary API credentials with Admin API access.
 * - This script is NEVER run automatically — it is manual only.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;
const { Op } = require('sequelize');
const { Booking, User, sequelize } = require('../models');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const APPLY = process.argv.includes('--apply');

// Same parsing rules as backend/routes/documents.js — keep in sync.
function publicIdFromUrl(url) {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return null;
  const m = url.match(/\/image\/(?:upload|authenticated)\/(.+)$/);
  if (!m) return null;
  const rest = m[1]
    .replace(/^s--[A-Za-z0-9_-]+--\//, '')
    .replace(/^v\d+\//, '')
    .replace(/\.(jpg|jpeg|png|webp|gif|pdf)$/i, '');
  return decodeURIComponent(rest) || null;
}

async function collectTargets() {
  const targets = [];

  const bookings = await Booking.findAll({
    attributes: ['id', 'paymentProof'],
    where: { paymentProof: { [Op.ne]: null } },
  });
  for (const b of bookings) {
    targets.push({ label: `Booking#${b.id} paymentProof`, url: b.paymentProof });
  }

  const users = await User.findAll({
    attributes: ['id', 'idFront', 'idBack'],
    where: { [Op.or]: [{ idFront: { [Op.ne]: null } }, { idBack: { [Op.ne]: null } }] },
  });
  for (const u of users) {
    if (u.idFront) targets.push({ label: `User#${u.id} idFront`, url: u.idFront });
    if (u.idBack)  targets.push({ label: `User#${u.id} idBack`,  url: u.idBack });
  }
  return targets;
}

async function main() {
  console.log(APPLY ? 'APPLY MODE — changes will be made.' : 'DRY RUN — no changes will be made. Pass --apply to execute.');
  await sequelize.authenticate();

  const targets = await collectTargets();
  console.log(`Found ${targets.length} document references in the database.\n`);

  let wouldChange = 0, changed = 0, skipped = 0, errors = 0;

  for (const t of targets) {
    const publicId = publicIdFromUrl(t.url);
    if (!publicId) {
      console.log(`[SKIP] ${t.label}: could not parse a Cloudinary public_id from stored URL`);
      skipped++;
      continue;
    }
    let resource;
    try {
      resource = await cloudinary.api.resource(publicId, { resource_type: 'image' });
    } catch (e) {
      console.log(`[ERROR] ${t.label} (${publicId}): ${e.message}`);
      errors++;
      continue;
    }
    const current = resource.access_mode || resource.type || 'unknown';
    if (current === 'authenticated') {
      console.log(`[OK]   ${t.label} (${publicId}): already authenticated`);
      skipped++;
      continue;
    }
    wouldChange++;
    if (!APPLY) {
      console.log(`[WOULD] ${t.label} (${publicId}): ${current} -> authenticated`);
      continue;
    }
    try {
      // Flip delivery to authenticated without renaming the asset.
      await cloudinary.api.update(publicId, { resource_type: 'image', access_mode: 'authenticated' });
      console.log(`[DONE] ${t.label} (${publicId}): now authenticated`);
      changed++;
    } catch (e) {
      console.log(`[ERROR] ${t.label} (${publicId}): ${e.message}`);
      errors++;
    }
  }

  console.log(`\nSummary: ${targets.length} documents, ${APPLY ? changed + ' changed' : wouldChange + ' would change'}, ${skipped} already ok/skipped, ${errors} errors.`);
  await sequelize.close();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
