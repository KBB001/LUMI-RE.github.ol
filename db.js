/**
 * ═══════════════════════════════════════════════════════════════
 *  LUMIÈRE — API Client Layer  (db.js)
 *  Replaces the old localStorage simulation with real fetch() calls.
 *
 *  Backend must be running at http://localhost:3000
 *  Start it: cd backend && npm install && node seed.js && node server.js
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

// ── Config ────────────────────────────────────────────────────
// 1. Для работы на вашем ПК (локально):
const API_BASE = 'http://localhost:3000/api';

// 2. Для интернета (когда загрузите сервер на Render.com):
// Закомментируйте строку выше (поставьте //) и раскомментируйте строку ниже,
// вставив туда вашу ссылку от Render:
// const API_BASE = 'https://lumiere-api-XXXX.onrender.com/api';

// ── Token storage ─────────────────────────────────────────────
function getToken()          { return localStorage.getItem('lm_jwt'); }
function setToken(t)         { localStorage.setItem('lm_jwt', t); }
function removeToken()       { localStorage.removeItem('lm_jwt'); }

// ── HTTP helpers ──────────────────────────────────────────────
function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
           : { 'Content-Type': 'application/json' };
}

async function api(method, path, body) {
  const opts = { method, headers: authHeaders() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(API_BASE + path, opts);
    return r.json();
  } catch (e) {
    console.error('[API]', method, path, e);
    return { error: 'Сервер недоступен. Убедитесь что backend запущен.' };
  }
}

// ── PRODUCTS ──────────────────────────────────────────────────
async function getProducts()         { return api('GET', '/products'); }
async function saveProduct(product)  { return product.id ? api('PUT', '/products/' + product.id, product) : api('POST', '/products', product); }
async function deleteProduct(id)     { return api('DELETE', '/products/' + id); }

// ── STOCK ─────────────────────────────────────────────────────
async function getStock()            { return api('GET', '/stock'); }
async function setStock(productId, qty) { return api('PUT', '/stock/' + productId, { qty }); }

// ── USERS ─────────────────────────────────────────────────────
async function getUsers()            { return api('GET', '/users'); }
async function getUserById(id)       { return api('GET', '/users/' + id); }
async function updateUser(userId, changes) {
  // If changing own profile — use /auth/me
  const sess = getSession();
  if (sess && sess.userId === userId) return api('PUT', '/auth/me', changes);
  return api('PUT', '/users/' + userId, changes);
}
async function updateUserRole(userId, role) { return api('PUT', '/users/' + userId + '/role', { role }); }
async function toggleUserBan(userId)        { return api('PUT', '/users/' + userId + '/ban', {}); }

// ── AUTH ──────────────────────────────────────────────────────
async function login(email, password) {
  const r = await api('POST', '/auth/login', { email, password });
  if (r.error) return { error: r.error };
  setToken(r.token);
  // store session info in localStorage for quick sync checks
  localStorage.setItem('lm_session', JSON.stringify({
    userId: r.user.id, role: r.user.role, loginAt: new Date().toISOString()
  }));
  return { success: true, user: r.user };
}

async function register(fullName, email, password, phone) {
  const r = await api('POST', '/auth/register', { full_name: fullName, email, password, phone });
  if (r.error) return { error: r.error };
  setToken(r.token);
  localStorage.setItem('lm_session', JSON.stringify({
    userId: r.user.id, role: r.user.role, loginAt: new Date().toISOString()
  }));
  return { success: true, user: r.user };
}

function logout() {
  removeToken();
  localStorage.removeItem('lm_session');
}

/** Synchronous — reads cached session from localStorage */
function getSession() {
  return JSON.parse(localStorage.getItem('lm_session') || 'null');
}

/** Async — validates token with server and returns full user object */
async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  const r = await api('GET', '/auth/me');
  if (r.error) { logout(); return null; }
  return r;
}

// ── ADDRESSES ─────────────────────────────────────────────────
async function getAddressesByUser(userId) { return api('GET', '/addresses'); }
async function saveAddress(address) {
  if (address.id && !address.id.startsWith('__new')) return api('PUT', '/addresses/' + address.id, address);
  const { id, ...rest } = address;
  return api('POST', '/addresses', rest);
}
async function deleteAddress(id)          { return api('DELETE', '/addresses/' + id); }

// ── ORDERS ────────────────────────────────────────────────────
async function getOrdersByUser(userId)    { return api('GET', '/orders'); }
async function getAllOrders()             { return api('GET', '/orders/all'); }
async function updateOrderStatus(orderId, status, track) { return api('PUT', '/orders/' + orderId, { status, track }); }
async function deleteOrder(orderId)       { return api('DELETE', '/orders/' + orderId); }

// ── WISHLIST ──────────────────────────────────────────────────
async function getWishlist(userId) {
  const r = await api('GET', '/stock/wishlist/' + userId);
  return Array.isArray(r) ? r : [];
}
async function toggleWishlist(userId, productId) {
  const r = await api('POST', '/stock/wishlist/' + userId + '/' + productId);
  return r.in_wishlist;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
// Notifications are part of dashboard; fetched from orders/products polling.
// For now keep a localStorage fallback for notifications.
function getNotifications()  { return JSON.parse(localStorage.getItem('lm_notif') || '[]'); }
function markNotifRead(id)   { const n=getNotifications().map(x=>x.id===id?{...x,read:true}:x); localStorage.setItem('lm_notif',JSON.stringify(n)); }
function addNotification(type, msg) {
  const n=getNotifications();
  n.unshift({id:'n_'+Date.now(),type,msg,time:new Date().toISOString(),read:false});
  localStorage.setItem('lm_notif',JSON.stringify(n.slice(0,50)));
}

// ── Auto-init ─────────────────────────────────────────────────
function initDb() {
  // Nothing to seed — data lives in the backend SQLite DB.
  // Just verify server is reachable (non-blocking).
  fetch(API_BASE.replace('/api', '') + '/api/health')
    .then(r => r.json())
    .then(() => console.log('%c✦ LUMIÈRE API connected', 'color:#D4907E;font-weight:bold'))
    .catch(() => console.warn('⚠️ LUMIÈRE backend not detected at ' + API_BASE + '. Run: cd backend && node server.js'));
}

initDb();

// ── Export (for Node/module environments) ─────────────────────
if (typeof module !== 'undefined') {
  module.exports = {
    getProducts, saveProduct, deleteProduct,
    getStock, setStock,
    getUsers, getUserById, updateUser, updateUserRole, toggleUserBan,
    getAddressesByUser, saveAddress, deleteAddress,
    getOrdersByUser, getAllOrders, updateOrderStatus, deleteOrder,
    getWishlist, toggleWishlist,
    login, logout, register, getSession, getCurrentUser,
    getNotifications, markNotifRead, addNotification,
    initDb,
  };
}
