'use strict';
/**
 * ══════════════════════════════════════════════════════════
 *  LUMIÈRE — JSON Database Layer  (backend/database.js)
 *  Uses lowdb (pure JS) — no compilation required.
 *  Data stored in: backend/db.json
 * ══════════════════════════════════════════════════════════
 */
const low    = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path   = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db      = low(adapter);

// ── Default schema (first run) ───────────────────────────────
db.defaults({
  users: [],
  products: [],
  stock: {},
  addresses: [],
  orders: [],
  wishlist: {},
  notifications: [],
}).write();

module.exports = db;
