/**
 * ═══════════════════════════════════════════════════════════════
 *  LUMIÈRE — API Client Layer  (db.js)
 *
 *  Режим 1 (локально / Render.com): подключается к backend API
 *  Режим 2 (GitHub Pages без backend): работает с mock-данными
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

// ── Config ────────────────────────────────────────────────────
// Для работы на вашем ПК (локально):
// const API_BASE = 'http://localhost:3000/api';

// Для Render.com (раскомментируйте и вставьте вашу ссылку):
// const API_BASE = 'https://lumiere-api-XXXX.onrender.com/api';

// Автоматический выбор: localhost локально, пустую строку — на GitHub Pages
const IS_GITHUB_PAGES = location.hostname.includes('github.io') || location.hostname.includes('github.ol');
const API_BASE = IS_GITHUB_PAGES ? '' : 'http://localhost:3000/api';

// ── Token storage ─────────────────────────────────────────────
function getToken()    { return localStorage.getItem('lm_jwt'); }
function setToken(t)   { localStorage.setItem('lm_jwt', t); }
function removeToken() { localStorage.removeItem('lm_jwt'); }

// ── HTTP helpers ──────────────────────────────────────────────
function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' }
           : { 'Content-Type': 'application/json' };
}

async function api(method, path, body) {
  if (!API_BASE) return { error: 'offline' };
  const opts = { method, headers: authHeaders() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(API_BASE + path, opts);
    return r.json();
  } catch (e) {
    console.warn('[API]', method, path, '→ offline');
    return { error: 'offline' };
  }
}

// ══════════════════════════════════════════════════════════════
//  MOCK DATA — отображается когда backend недоступен
// ══════════════════════════════════════════════════════════════
const MOCK_PRODUCTS = [
  { id:'p1', brand:'Chanel', name:'N°5 Eau de Parfum', cat:'fragrance', price:95000, oldPrice:null, badge:'hit', stars:'★★★★★', reviews:3241, art:'pa-perfume', desc:'Культовый аромат. Символ утончённости и элегантности. Нотки альдегидов, жасмина и ванили.' },
  { id:'p2', brand:'La Mer', name:'Moisturizing Cream', cat:'skincare', price:148000, oldPrice:null, badge:'new', stars:'★★★★★', reviews:1892, art:'pa-cream', desc:'Легендарный увлажняющий крем с Miracle Broth™. Восстанавливает и трансформирует кожу.' },
  { id:'p3', brand:'NARS', name:'Sheer Glow Foundation', cat:'makeup', price:32000, oldPrice:38000, badge:'sale', stars:'★★★★☆', reviews:876, art:'pa-serum', desc:'Тональная основа с натуральным сиянием. 36 оттенков. Стойкость до 16 часов.' },
  { id:'p4', brand:'Charlotte Tilbury', name:'Magic Cream', cat:'skincare', price:45000, oldPrice:null, badge:'hit', stars:'★★★★★', reviews:2104, art:'pa-cream', desc:'Любимый крем звёзд. Мгновенное сияние и интенсивное увлажнение за 10 минут.' },
  { id:'p5', brand:'Dior', name:'Rouge Dior Lipstick', cat:'makeup', price:28000, oldPrice:null, badge:'new', stars:'★★★★★', reviews:543, art:'pa-lipstick', desc:'Культовая губная помада. 100 оттенков. Кремовая текстура с уходом для губ.' },
  { id:'p6', brand:'Jo Malone', name:'Peony & Blush Suede', cat:'fragrance', price:78000, oldPrice:85000, badge:'sale', stars:'★★★★★', reviews:712, art:'pa-perfume', desc:'Чувственный аромат пионов, нектарина и замши. Олицетворение женственности.' },
  { id:'p7', brand:'Lancôme', name:'Génifique Serum', cat:'skincare', price:62000, oldPrice:null, badge:'hit', stars:'★★★★★', reviews:1567, art:'pa-serum', desc:'Передовая сыворотка с пробиотиками. Улучшает кожу за 7 дней. Дерматологически протестирована.' },
  { id:'p8', brand:'MAC', name:'Prep + Prime Fix+', cat:'body', price:15000, oldPrice:18000, badge:'sale', stars:'★★★★☆', reviews:2891, art:'pa-serum', desc:'Фиксатор макияжа и увлажняющий спрей. Делает кожу свежей и сияющей в течение дня.' },
  { id:'p9', brand:'Armani', name:'Luminous Silk Foundation', cat:'makeup', price:42000, oldPrice:null, badge:'new', stars:'★★★★★', reviews:1234, art:'pa-serum', desc:'Тональная основа с шёлковой текстурой. Второе место в рейтинге бестселлеров мира.' },
  { id:'p10', brand:'Chanel', name:'Le Blanc Serum', cat:'skincare', price:88000, oldPrice:null, badge:'new', stars:'★★★★★', reviews:432, art:'pa-serum', desc:'Роскошная отбеливающая сыворотка. Выравнивает тон, придаёт сияние и увлажняет.' },
  { id:'p11', brand:'Bobbi Brown', name:'Extra Face Oil', cat:'skincare', price:55000, oldPrice:60000, badge:'sale', stars:'★★★★☆', reviews:876, art:'pa-oil', desc:'Питательное масло для лица с экстрактом моркови. Восстанавливает и придаёт свежесть.' },
  { id:'p12', brand:'NARS', name:'Blush — Orgasm', cat:'makeup', price:25000, oldPrice:null, badge:'hit', stars:'★★★★★', reviews:4512, art:'pa-blush', desc:'Самые популярные румяна в мире. Золотистый персиковый оттенок подходит для любого тона кожи.' },
];

// Демо-пользователи (авто-загружаются при первом запуске)
const MOCK_USERS_SEED = [
  { id:'u1', full_name:'Admin LUMIÈRE', email:'admin@lumiere.kz', _pass:'admin123',    phone:'+77771234567', avatar_url:null, role:'admin',    is_active:true, banned:false, created_at:'2024-01-01T00:00:00Z' },
  { id:'u2', full_name:'Айна Бекова',  email:'aina@example.kz',  _pass:'customer123', phone:'+77012345678', avatar_url:null, role:'customer', is_active:true, banned:false, created_at:'2024-02-15T10:30:00Z' },
];

const MOCK_ORDERS_SEED = {
  u2: [
    { id:'ord-001', user_id:'u2', date:'2026-03-01T10:15:00Z', total:122900, status:'delivered',  track:'KZ123456789', address:'г. Алматы, ул. Абая, 10, кв. 25', items:[{name:'Moisturizing Soft Cream',qty:1,price:98000},{name:'Matte Lipstick',qty:2,price:12900}] },
    { id:'ord-002', user_id:'u2', date:'2026-03-07T14:30:00Z', total:76000,  status:'in_transit', track:'KZ987654321', address:'г. Алматы, ул. Абая, 10, кв. 25', items:[{name:'Peony & Blush Suede',qty:1,price:76000}] },
    { id:'ord-004', user_id:'u2', date:'2026-03-09T16:45:00Z', total:24900,  status:'processing', track:'',            address:'г. Алматы, ул. Абая, 10, кв. 25', items:[{name:'Radiant Creamy Concealer',qty:1,price:24900}] },
  ],
  u1: [
    { id:'ord-003', user_id:'u1', date:'2026-03-08T09:00:00Z', total:58000, status:'processing', track:'', address:'г. Астана, пр. Республики, 1', items:[{name:'Magic Cream',qty:1,price:58000}] },
    { id:'ord-005', user_id:'u1', date:'2026-03-09T20:10:00Z', total:94000, status:'processing', track:'', address:'г. Астана, пр. Республики, 1', items:[{name:'Sauvage Elixir',qty:1,price:94000}] },
  ]
};

const MOCK_ADDRESSES_SEED = {
  u2: [{ id:'a1', user_id:'u2', label:'Дом', recipient_name:'Айна Бекова', recipient_phone:'+77012345678', country:'Казахстан', city:'Алматы', street:'ул. Абая, 10', apartment:'кв. 25', postal_code:'050000', delivery_notes:'', is_default:true, created_at:'2024-02-15T10:30:00Z' }]
};

// Mock пользователи — читаем из localStorage, seed делается в initDb()
const MOCK_DB_VERSION = 'v3';
function getMockUsers() {
  return JSON.parse(localStorage.getItem('lm_mock_users') || JSON.stringify(MOCK_USERS_SEED));
}
function saveMockUsers(users) {
  localStorage.setItem('lm_mock_users', JSON.stringify(users));
}

// ── PRODUCTS ──────────────────────────────────────────────────
async function getProducts() {
  if (IS_GITHUB_PAGES) return MOCK_PRODUCTS;
  const r = await api('GET', '/products');
  if (r && r.error === 'offline') return MOCK_PRODUCTS;
  return Array.isArray(r) ? r : MOCK_PRODUCTS;
}
async function saveProduct(product)  { return product.id ? api('PUT', '/products/' + product.id, product) : api('POST', '/products', product); }
async function deleteProduct(id)     { return api('DELETE', '/products/' + id); }

// ── STOCK ─────────────────────────────────────────────────────
async function getStock()            { return api('GET', '/stock'); }
async function setStock(productId, qty) { return api('PUT', '/stock/' + productId, { qty }); }

// ── USERS ─────────────────────────────────────────────────────
async function getUsers() {
  if (IS_GITHUB_PAGES) return getMockUsers();
  const r = await api('GET', '/users');
  if (r && r.error) return getMockUsers();
  return r;
}
async function getUserById(id) {
  if (IS_GITHUB_PAGES) return getMockUsers().find(u => u.id === id) || null;
  return api('GET', '/users/' + id);
}
async function updateUser(userId, changes) {
  if (IS_GITHUB_PAGES) {
    const users = getMockUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) { Object.assign(users[idx], changes); saveMockUsers(users); return users[idx]; }
    return { error: 'User not found' };
  }
  const sess = getSession();
  if (sess && sess.userId === userId) return api('PUT', '/auth/me', changes);
  return api('PUT', '/users/' + userId, changes);
}
async function updateUserRole(userId, role) { return api('PUT', '/users/' + userId + '/role', { role }); }
async function toggleUserBan(userId)        { return api('PUT', '/users/' + userId + '/ban', {}); }

// ── AUTH ──────────────────────────────────────────────────────
async function login(email, password) {
  if (IS_GITHUB_PAGES) {
    // Mock login
    const users = getMockUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { error: 'Неверный email или пароль' };
    if (user.banned) return { error: 'Аккаунт заблокирован' };
    // Simple password check (mock — no hashing in demo)
    if (user._pass !== password) return { error: 'Неверный email или пароль' };
    const mockToken = 'mock_token_' + Date.now();
    setToken(mockToken);
    localStorage.setItem('lm_session', JSON.stringify({
      userId: user.id, role: user.role, loginAt: new Date().toISOString()
    }));
    const { _pass, ...safe } = user;
    return { success: true, user: safe };
  }
  const r = await api('POST', '/auth/login', { email, password });
  if (r.error) return { error: r.error };
  setToken(r.token);
  localStorage.setItem('lm_session', JSON.stringify({
    userId: r.user.id, role: r.user.role, loginAt: new Date().toISOString()
  }));
  return { success: true, user: r.user };
}

async function register(fullName, email, password, phone) {
  if (IS_GITHUB_PAGES) {
    // Mock register
    const users = getMockUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { error: 'Пользователь с таким email уже существует' };
    }
    const newUser = {
      id: 'u_' + Date.now(),
      full_name: fullName.trim(),
      email: email.toLowerCase().trim(),
      _pass: password, // demo only — plain text
      phone: phone || null,
      avatar_url: null,
      role: 'customer',
      is_active: true,
      banned: false,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    saveMockUsers(users);
    const mockToken = 'mock_token_' + Date.now();
    setToken(mockToken);
    localStorage.setItem('lm_session', JSON.stringify({
      userId: newUser.id, role: newUser.role, loginAt: new Date().toISOString()
    }));
    const { _pass, ...safe } = newUser;
    return { success: true, user: safe };
  }
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

/** Async — validates token with server (or mock) and returns full user object */
async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  if (IS_GITHUB_PAGES) {
    const sess = getSession();
    if (!sess) return null;
    const users = getMockUsers();
    return users.find(u => u.id === sess.userId) || null;
  }
  const r = await api('GET', '/auth/me');
  if (r.error) { logout(); return null; }
  return r;
}

// ── ADDRESSES ─────────────────────────────────────────────────
async function getAddressesByUser(userId) {
  if (IS_GITHUB_PAGES) return JSON.parse(localStorage.getItem('lm_addr_' + userId) || '[]');
  return api('GET', '/addresses');
}
async function saveAddress(address) {
  if (IS_GITHUB_PAGES) {
    const sess = getSession();
    if (!sess) return { error: 'Not logged in' };
    const key = 'lm_addr_' + sess.userId;
    const addrs = JSON.parse(localStorage.getItem(key) || '[]');
    if (address.id && !address.id.startsWith('__new')) {
      const idx = addrs.findIndex(a => a.id === address.id);
      if (idx !== -1) addrs[idx] = address;
    } else {
      const { id, ...rest } = address;
      addrs.push({ ...rest, id: 'addr_' + Date.now() });
    }
    localStorage.setItem(key, JSON.stringify(addrs));
    return { success: true };
  }
  if (address.id && !address.id.startsWith('__new')) return api('PUT', '/addresses/' + address.id, address);
  const { id, ...rest } = address;
  return api('POST', '/addresses', rest);
}
async function deleteAddress(id) {
  if (IS_GITHUB_PAGES) {
    const sess = getSession();
    if (!sess) return;
    const key = 'lm_addr_' + sess.userId;
    const addrs = JSON.parse(localStorage.getItem(key) || '[]').filter(a => a.id !== id);
    localStorage.setItem(key, JSON.stringify(addrs));
    return { success: true };
  }
  return api('DELETE', '/addresses/' + id);
}

// ── ORDERS ────────────────────────────────────────────────────
async function getOrdersByUser(userId) {
  if (IS_GITHUB_PAGES) return JSON.parse(localStorage.getItem('lm_orders_' + userId) || '[]');
  return api('GET', '/orders');
}
async function getAllOrders()             { return api('GET', '/orders/all'); }
async function updateOrderStatus(orderId, status, track) { return api('PUT', '/orders/' + orderId, { status, track }); }
async function deleteOrder(orderId)       { return api('DELETE', '/orders/' + orderId); }

// ── WISHLIST ──────────────────────────────────────────────────
async function getWishlist(userId) {
  if (IS_GITHUB_PAGES) return JSON.parse(localStorage.getItem('lm_wish_' + userId) || '[]');
  const r = await api('GET', '/stock/wishlist/' + userId);
  return Array.isArray(r) ? r : [];
}
async function toggleWishlist(userId, productId) {
  if (IS_GITHUB_PAGES) {
    const key = 'lm_wish_' + userId;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = list.indexOf(productId);
    if (idx === -1) list.push(productId);
    else list.splice(idx, 1);
    localStorage.setItem(key, JSON.stringify(list));
    return idx === -1; // true = now in wishlist
  }
  const r = await api('POST', '/stock/wishlist/' + userId + '/' + productId);
  return r.in_wishlist;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function getNotifications()  { return JSON.parse(localStorage.getItem('lm_notif') || '[]'); }
function markNotifRead(id)   { const n=getNotifications().map(x=>x.id===id?{...x,read:true}:x); localStorage.setItem('lm_notif',JSON.stringify(n)); }
function addNotification(type, msg) {
  const n=getNotifications();
  n.unshift({id:'n_'+Date.now(),type,msg,time:new Date().toISOString(),read:false});
  localStorage.setItem('lm_notif',JSON.stringify(n.slice(0,50)));
}

// ── Auto-init ────────────────────────────────────────────────────────────
function initDb() {
  if (IS_GITHUB_PAGES) {
    // Запускаем seed сразу при загрузке страницы
    if (localStorage.getItem('lm_mock_seeded') !== MOCK_DB_VERSION) {
      // Оставляем аккаунты пользователей (чтобы не стереть созданные аккаунты)
      const existingUsers = JSON.parse(localStorage.getItem('lm_mock_users') || '[]');
      // Добавляем seed-аккаунты если их ещё нет
      const merged = [...existingUsers];
      MOCK_USERS_SEED.forEach(seedUser => {
        if (!merged.find(u => u.id === seedUser.id)) {
          merged.push(seedUser);
        }
      });
      localStorage.setItem('lm_mock_users', JSON.stringify(merged));
      // Седаем заказы и адреса для демо-пользователей
      Object.entries(MOCK_ORDERS_SEED).forEach(([uid, orders]) => {
        if (!localStorage.getItem('lm_orders_' + uid))
          localStorage.setItem('lm_orders_' + uid, JSON.stringify(orders));
      });
      Object.entries(MOCK_ADDRESSES_SEED).forEach(([uid, addrs]) => {
        if (!localStorage.getItem('lm_addr_' + uid))
          localStorage.setItem('lm_addr_' + uid, JSON.stringify(addrs));
      });
      localStorage.setItem('lm_mock_seeded', MOCK_DB_VERSION);
      console.log('%c✔ LUMIÈRE demo data ready (v3)', 'color:#D4907E;font-weight:bold');
    }
    console.log('%c✦ LUMIÈRE Demo Mode (GitHub Pages)', 'color:#D4907E;font-weight:bold');
    console.log('%c  Данные хранятся локально в браузере. Для production подключите backend.', 'color:#8C6E60;font-size:11px');
    return;
  }
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
