/**
 * ═══════════════════════════════════════════════════════════════
 *  LUMIÈRE — Secure API Client Layer (db-secure.js)
 *  
 *  ✓ XSS защита
 *  ✓ CSRF токены
 *  ✓ Безопасное хранилище
 *  ✓ Валидация данных
 *  ✓ Rate limiting
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

const IS_GITHUB_PAGES = location.hostname.includes('github.io');
const API_BASE = IS_GITHUB_PAGES ? '' : 'http://localhost:3000/api';

// ── CSRF Token Management ─────────────────────────────────────
class CsrfTokenManager {
  static getToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = this.generateToken();
      sessionStorage.setItem('csrf_token', token);
    }
    return token;
  }
  
  static generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// ── XSS Protection ────────────────────────────────────────────
class XSSProtection {
  static escape(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  static createSafeElement(tag, content, attributes = {}) {
    const el = document.createElement(tag);
    el.textContent = content;
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'string' && !key.startsWith('on')) {
        el.setAttribute(key, value);
      }
    });
    return el;
  }
}

// ── Input Validation ──────────────────────────────────────────
class InputValidator {
  static validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email) && email.length <= 254;
  }
  
  static validatePassword(password) {
    return password.length >= 8 && 
           /[0-9]/.test(password) &&
           /[a-zA-Z]/.test(password) &&
           /[!@#$%^&*]/.test(password);
  }
  
  static validatePhone(phone) {
    return /^\+7\d{9,10}$/.test(phone.replace(/\s/g, ''));
  }
  
  static validateName(name) {
    return name.trim().length >= 2 && name.trim().length <= 100;
  }
  
  static sanitizeInput(input) {
    return input.trim().slice(0, 500);
  }
}

// ── Rate Limiting ─────────────────────────────────────────────
class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

const authLimiter = new RateLimiter(5, 60000);

// ── Token Storage ──────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('lm_jwt_secure');
}

function setToken(token) {
  if (!token || typeof token !== 'string' || token.length > 5000) {
    console.error('Invalid token');
    return false;
  }
  sessionStorage.setItem('lm_jwt_secure', token);
  return true;
}

function removeToken() {
  sessionStorage.removeItem('lm_jwt_secure');
  sessionStorage.removeItem('csrf_token');
}

// ── HTTP Helpers ───────────────────────────────────────────────
function authHeaders() {
  const token = getToken();
  const csrf = CsrfTokenManager.getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
  };
}

async function api(method, path, body) {
  if (!API_BASE) return { error: 'offline' };
  
  if (path.includes('/auth') && !authLimiter.isAllowed()) {
    return { error: 'Too many requests. Please try again later.' };
  }
  
  const opts = {
    method,
    headers: authHeaders(),
    credentials: 'include',
  };
  
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(API_BASE + path, opts);
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/';
      return { error: 'Unauthorized' };
    }
    
    if (response.status === 429) {
      return { error: 'Too many requests' };
    }
    
    if (!response.ok) {
      const error = await response.json();
      return error;
    }
    
    return await response.json();
  } catch (e) {
    console.error('[API Error]', method, path, e);
    return { error: 'Network error' };
  }
}

// ══════════════════════════════════════════════════════════════
//  AUTH FUNCTIONS
// ══════════════════════════════════════════════════════════════

async function login(email, password) {
  if (!InputValidator.validateEmail(email)) {
    return { error: 'Invalid email format' };
  }
  if (password.length < 8) {
    return { error: 'Password too short' };
  }
  
  const sanitizedEmail = InputValidator.sanitizeInput(email.toLowerCase());
  
  const response = await api('POST', '/auth/login', {
    email: sanitizedEmail,
    password: password,
  });
  
  if (response.error) {
    return { error: response.error };
  }
  
  if (!setToken(response.token)) {
    return { error: 'Failed to store authentication' };
  }
  
  sessionStorage.setItem('lm_session', JSON.stringify({
    userId: response.user.id,
    role: response.user.role,
    loginAt: new Date().toISOString(),
  }));
  
  return { success: true, user: response.user };
}

async function register(fullName, email, password, phone) {
  if (!InputValidator.validateName(fullName)) {
    return { error: 'Invalid name (2-100 characters)' };
  }
  if (!InputValidator.validateEmail(email)) {
    return { error: 'Invalid email format' };
  }
  if (!InputValidator.validatePassword(password)) {
    return { error: 'Password must have 8+ chars, numbers, letters, and symbols' };
  }
  if (!InputValidator.validatePhone(phone)) {
    return { error: 'Invalid phone format' };
  }
  
  const response = await api('POST', '/auth/register', {
    full_name: InputValidator.sanitizeInput(fullName),
    email: InputValidator.sanitizeInput(email.toLowerCase()),
    password: password,
    phone: phone,
  });
  
  if (response.error) {
    return { error: response.error };
  }
  
  if (!setToken(response.token)) {
    return { error: 'Failed to store authentication' };
  }
  
  sessionStorage.setItem('lm_session', JSON.stringify({
    userId: response.user.id,
    role: response.user.role,
    loginAt: new Date().toISOString(),
  }));
  
  return { success: true, user: response.user };
}

function logout() {
  removeToken();
  sessionStorage.removeItem('lm_session');
  api('POST', '/auth/logout', {});
}

function getSession() {
  const session = sessionStorage.getItem('lm_session');
  return session ? JSON.parse(session) : null;
}

async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  
  const response = await api('GET', '/auth/me');
  if (response.error) {
    logout();
    return null;
  }
  
  return response;
}

// ── PRODUCTS ──────────────────────────��───────────────────────
async function getProducts() {
  return api('GET', '/products');
}

async function saveProduct(product) {
  if (!product || typeof product !== 'object') {
    return { error: 'Invalid product' };
  }
  
  return product.id
    ? api('PUT', `/products/${encodeURIComponent(product.id)}`, product)
    : api('POST', '/products', product);
}

async function deleteProduct(id) {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid product ID' };
  }
  return api('DELETE', `/products/${encodeURIComponent(id)}`);
}

// ── USERS ─────────────────────────────────────────────────────
async function getUsers() {
  return api('GET', '/users');
}

async function getUserById(id) {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid user ID' };
  }
  return api('GET', `/users/${encodeURIComponent(id)}`);
}

async function updateUser(userId, changes) {
  const session = getSession();
  if (!session || session.userId !== userId) {
    return { error: 'Unauthorized' };
  }
  
  return api('PUT', `/users/${encodeURIComponent(userId)}`, changes);
}

// ── ADDRESSES ─────────────────────────────────────────────────
async function getAddressesByUser(userId) {
  const session = getSession();
  if (!session || session.userId !== userId) {
    return [];
  }
  return api('GET', '/addresses');
}

async function saveAddress(address) {
  const session = getSession();
  if (!session) return { error: 'Not logged in' };
  
  if (!address || typeof address !== 'object') {
    return { error: 'Invalid address' };
  }
  
  if (address.id && !address.id.startsWith('__new')) {
    return api('PUT', `/addresses/${encodeURIComponent(address.id)}`, address);
  }
  
  const { id, ...rest } = address;
  return api('POST', '/addresses', rest);
}

async function deleteAddress(id) {
  if (!id || typeof id !== 'string') {
    return { error: 'Invalid address ID' };
  }
  return api('DELETE', `/addresses/${encodeURIComponent(id)}`);
}

// ── ORDERS ────────────────────────────────────────────────────
async function getOrdersByUser(userId) {
  const session = getSession();
  if (!session || session.userId !== userId) {
    return [];
  }
  return api('GET', '/orders');
}

async function updateOrderStatus(orderId, status, track) {
  if (!orderId || typeof orderId !== 'string') {
    return { error: 'Invalid order ID' };
  }
  
  const validStatuses = ['processing', 'in_transit', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return { error: 'Invalid status' };
  }
  
  return api('PUT', `/orders/${encodeURIComponent(orderId)}`, { status, track });
}

// ── WISHLIST ──────────────────────────────────────────────────
async function getWishlist(userId) {
  const session = getSession();
  if (!session || session.userId !== userId) {
    return [];
  }
  const response = await api('GET', `/stock/wishlist/${encodeURIComponent(userId)}`);
  return Array.isArray(response) ? response : [];
}

async function toggleWishlist(userId, productId) {
  const session = getSession();
  if (!session || session.userId !== userId) {
    return false;
  }
  
  if (!productId || typeof productId !== 'string') {
    return false;
  }
  
  const response = await api(
    'POST',
    `/stock/wishlist/${encodeURIComponent(userId)}/${encodeURIComponent(productId)}`
  );
  return response.in_wishlist || false;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function getNotifications() {
  const data = sessionStorage.getItem('lm_notif');
  return data ? JSON.parse(data) : [];
}

function addNotification(type, msg) {
  const notifications = getNotifications();
  
  const validTypes = ['info', 'success', 'warning', 'error'];
  if (!validTypes.includes(type)) type = 'info';
  
  msg = XSSProtection.escape(msg).slice(0, 500);
  
  notifications.unshift({
    id: 'n_' + Date.now(),
    type,
    msg,
    time: new Date().toISOString(),
    read: false,
  });
  
  sessionStorage.setItem('lm_notif', JSON.stringify(notifications.slice(0, 50)));
}

// ── Initialization ────────────────────────────────────────────
function initDb() {
  console.log('%c✦ LUMIÈRE Secure Mode Active', 'color:#D4907E;font-weight:bold');
  console.log('%c✓ XSS Protection: Enabled', 'color:#90EE90');
  console.log('%c✓ CSRF Protection: Enabled', 'color:#90EE90');
  console.log('%c✓ Rate Limiting: Enabled', 'color:#90EE90');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDb);
} else {
  initDb();
}

if (typeof module !== 'undefined') {
  module.exports = {
    getProducts, saveProduct, deleteProduct,
    getUsers, getUserById, updateUser,
    getAddressesByUser, saveAddress, deleteAddress,
    getOrdersByUser, updateOrderStatus,
    getWishlist, toggleWishlist,
    login, logout, register, getSession, getCurrentUser,
    getNotifications, addNotification,
    InputValidator, XSSProtection, CsrfTokenManager,
    initDb,
  };
}
