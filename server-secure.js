'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const hpp = require('hpp');

const app = express();

// ── Security Headers (Helmet) ─────────────────────────────────
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));

// ── CORS Configuration (Restricted) ───────────────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://kbb001.github.io'
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later.',
});

app.use(limiter);

// ── Middleware ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(hpp());

// ── CSRF Protection ───────────────────────────────────────────
const csrfTokens = new Map();

app.post('/api/csrf-token', (req, res) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  const clientId = req.ip + req.get('user-agent');
  csrfTokens.set(token, { clientId, createdAt: Date.now() });
  
  for (const [key, value] of csrfTokens.entries()) {
    if (Date.now() - value.createdAt > 3600000) {
      csrfTokens.delete(key);
    }
  }
  
  res.json({ token });
});

function verifyCsrfToken(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.get('X-CSRF-Token');
  const clientId = req.ip + req.get('user-agent');
  
  if (!token || !csrfTokens.has(token)) {
    return res.status(403).json({ error: 'CSRF token invalid or missing' });
  }
  
  const tokenData = csrfTokens.get(token);
  if (tokenData.clientId !== clientId) {
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }
  
  csrfTokens.delete(token);
  next();
}

app.use(verifyCsrfToken);

// ── Input Validation Middleware ───────────────────────────────
function validateInput(req, res, next) {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }
  
  if (req.body.password) {
    if (req.body.password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[0-9]/.test(req.body.password) || !/[a-zA-Z]/.test(req.body.password)) {
      return res.status(400).json({ error: 'Password must contain letters and numbers' });
    }
  }
  
  next();
}

app.use(validateInput);

// ── Serve static frontend files ───────────────────────────────
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes (with rate limiting) ───────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/stock', require('./routes/stock'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    version: '1.0.0-secure',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── 404 for unknown API routes ────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handling middleware ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;
  
  res.status(err.status || 500).json({
    error: message,
  });
});

// ── SPA fallback: any non-API route → index.html ──────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n✦ LUMIÈRE Backend running → http://localhost:${PORT}`);
  console.log(`  API base: http://localhost:${PORT}/api`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Security: HELMET, CORS, Rate-Limiting, CSRF Protection enabled\n`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
