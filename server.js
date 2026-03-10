'use strict';
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500',
           'https://kbb001.github.io', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ── Serve static frontend files ───────────────────────────────
// When opened via http://localhost:3000 — serves the HTML/CSS/JS files
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/addresses',require('./routes/addresses'));
app.use('/api/stock',    require('./routes/stock'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0' });
});

// ── 404 for unknown API routes ────────────────────────────────
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));

// ── SPA fallback: any non-API route → index.html ──────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✦ LUMIÈRE Backend running → http://localhost:${PORT}`);
  console.log(`  API base: http://localhost:${PORT}/api`);
  console.log(`  Database: ${path.join(__dirname, 'db.sqlite')}\n`);
});
