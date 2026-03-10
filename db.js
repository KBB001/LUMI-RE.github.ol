/**
 * ═══════════════════════════════════════════════════
 *  LUMIÈRE — Client-Side Data Layer  (db.js)
 *  Simulates a database using localStorage.
 *
 *  ► Как подключить реальный бэкенд:
 *    Замените каждую функцию на fetch() к вашему API.
 *    Пример: вместо localStorage.getItem('products')
 *    используйте: await fetch('/api/products').then(r=>r.json())
 *
 *  ► Рекомендуемый стек бэкенда:
 *    Node.js + Express + Sequelize + PostgreSQL
 * ═══════════════════════════════════════════════════
 */
'use strict';

const DB_KEYS = {
  PRODUCTS: 'lm_products',
  USERS:    'lm_users',
  SESSION:  'lm_session',
  ADDRESSES:'lm_addresses',
  ORDERS:   'lm_orders',
};

// ── Default product catalog ─────────────────────────
const DEFAULT_PRODUCTS = [
  { id:'p1',  brand:'La Mer',              name:'Moisturizing Soft Cream',    price:98000,  oldPrice:null,  cat:'skincare',  badge:'hit',  stars:'★★★★★', reviews:412, art:'pa-cream',    desc:'Легендарный крем с морскими водорослями. Восстанавливает, увлажняет, омолаживает.' },
  { id:'p2',  brand:'NARS',                name:'Radiant Creamy Concealer',   price:24900,  oldPrice:null,  cat:'makeup',    badge:'new',  stars:'★★★★★', reviews:891, art:'pa-serum',    desc:'Перекрывающий консилер с радиантным финишем.' },
  { id:'p3',  brand:'Jo Malone',           name:'Peony & Blush Suede',        price:76000,  oldPrice:89000, cat:'fragrance', badge:'sale', stars:'★★★★☆', reviews:234, art:'pa-perfume',  desc:'Нежный цветочный аромат с нотами пиона и персика. 100 мл.' },
  { id:'p4',  brand:'Charlotte Tilbury',   name:'Magic Cream 60ml',           price:58000,  oldPrice:null,  cat:'skincare',  badge:'new',  stars:'★★★★★', reviews:677, art:'pa-cream',    desc:'Шедевральный крем — секрет звёздного макияжа.' },
  { id:'p5',  brand:'MAC',                 name:'Matte Lipstick Ruby Woo',    price:12900,  oldPrice:null,  cat:'makeup',    badge:null,   stars:'★★★★★', reviews:1204,art:'pa-lipstick', desc:'Культовый красный матовый оттенок.' },
  { id:'p6',  brand:'Bobbi Brown',         name:'Vitamin Enriched Primer',    price:32000,  oldPrice:null,  cat:'skincare',  badge:'new',  stars:'★★★★☆', reviews:318, art:'pa-serum',    desc:'Праймер-база с 5 витаминами. Держит макияж 12 часов.' },
  { id:'p7',  brand:'Lancôme',             name:'Génifique Youth Activator',  price:86000,  oldPrice:98000, cat:'skincare',  badge:'sale', stars:'★★★★★', reviews:543, art:'pa-serum',    desc:'Сыворотка-бустер с пробиотиками. Результат через 7 дней.' },
  { id:'p8',  brand:'Charlotte Tilbury',   name:'Airbrush Flawless Palette',  price:46000,  oldPrice:null,  cat:'makeup',    badge:null,   stars:'★★★★★', reviews:287, art:'pa-palette',  desc:'Палетка для безупречного макияжа.' },
  { id:'p9',  brand:'Dior',                name:'Sauvage Elixir 60ml',        price:94000,  oldPrice:null,  cat:'fragrance', badge:'hit',  stars:'★★★★★', reviews:756, art:'pa-perfume',  desc:'Мощный элексир с нотами перца и амброксана.' },
  { id:'p10', brand:'Sulwhasoo',           name:'Firming Sleeping Mask',      price:44000,  oldPrice:null,  cat:'skincare',  badge:'new',  stars:'★★★★☆', reviews:189, art:'pa-mask',     desc:'Ночная маска с женьшенем.' },
  { id:'p11', brand:'The Ordinary',        name:'Rosehip Oil 30ml',           price:7900,   oldPrice:12000, cat:'body',      badge:'sale', stars:'★★★★☆', reviews:423, art:'pa-oil',      desc:'Питательное масло шиповника холодного отжима.' },
  { id:'p12', brand:'Charlotte Tilbury',   name:'Cheek to Chic Blush',        price:28000,  oldPrice:null,  cat:'makeup',    badge:null,   stars:'★★★★★', reviews:312, art:'pa-blush',    desc:'Двойные румяна с атласным финишем.' },
];

// ── Default users ───────────────────────────────────
const DEFAULT_USERS = [
  {
    id: 'u1',
    full_name: 'Admin LUMIÈRE',
    email: 'admin@lumiere.kz',
    // NOTE: В продакшене — только bcrypt-хэш! Это СИМУЛЯЦИЯ для фронтенда.
    password: 'admin123',
    phone: '+77771234567',
    avatar_url: '',
    role: 'admin',
    email_verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u2',
    full_name: 'Айна Бекова',
    email: 'aina@example.kz',
    password: 'customer123',
    phone: '+77012345678',
    avatar_url: '',
    role: 'customer',
    email_verified: true,
    created_at: '2024-02-15T10:30:00Z',
  },
];

const DEFAULT_ADDRESSES = [
  {
    id: 'a1', user_id: 'u2',
    label: 'Дом', recipient_name: 'Айна Бекова',
    recipient_phone: '+77012345678', country: 'Казахстан',
    city: 'Алматы', street: 'ул. Абая, 10', apartment: 'кв. 25',
    postal_code: '050000', delivery_notes: '', is_default: true,
  },
];

const DEFAULT_ORDERS = [
  { id:'ord-001', user_id:'u2', date:'2026-03-01T10:15:00Z', total:122900, status:'delivered', track:'KZ123456789', address:'г. Алматы, ул. Абая, 10, кв. 25',
    items:[{name:'Moisturizing Soft Cream',qty:1,price:98000},{name:'Matte Lipstick Ruby Woo',qty:2,price:12900}] },
  { id:'ord-002', user_id:'u2', date:'2026-03-07T14:30:00Z', total:76000, status:'in_transit', track:'KZ987654321', address:'г. Алматы, ул. Абая, 10, кв. 25',
    items:[{name:'Peony & Blush Suede',qty:1,price:76000}] },
  { id:'ord-003', user_id:'u1', date:'2026-03-08T09:00:00Z', total:58000, status:'processing', track:'', address:'г. Астана, пр. Республики, 1',
    items:[{name:'Magic Cream 60ml',qty:1,price:58000}] },
  { id:'ord-004', user_id:'u2', date:'2026-03-09T16:45:00Z', total:24900, status:'confirmed', track:'', address:'г. Алматы, ул. Абая, 10, кв. 25',
    items:[{name:'Radiant Creamy Concealer',qty:1,price:24900}] },
  { id:'ord-005', user_id:'u1', date:'2026-03-09T20:10:00Z', total:94000, status:'processing', track:'', address:'г. Астана, пр. Республики, 1',
    items:[{name:'Sauvage Elixir 60ml',qty:1,price:94000}] },
];

const DEFAULT_NOTIFICATIONS = [
  { id:'n1', type:'warning', msg:'Остаток товара "Rosehip Oil 30ml" менее 5 шт.', time:'2026-03-10T00:30:00Z', read:false },
  { id:'n2', type:'info',    msg:'Новый пользователь зарегистрирован: aina@example.kz', time:'2026-03-09T22:00:00Z', read:false },
  { id:'n3', type:'success', msg:'Заказ #ord-001 успешно доставлен', time:'2026-03-09T18:05:00Z', read:true },
];

// ══════════════════════════════════════════
//  INIT — seed on first load
// ══════════════════════════════════════════
function initDb() {
  if (!localStorage.getItem(DB_KEYS.PRODUCTS))  localStorage.setItem(DB_KEYS.PRODUCTS,  JSON.stringify(DEFAULT_PRODUCTS));
  if (!localStorage.getItem(DB_KEYS.USERS))     localStorage.setItem(DB_KEYS.USERS,     JSON.stringify(DEFAULT_USERS));
  if (!localStorage.getItem(DB_KEYS.ADDRESSES)) localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(DEFAULT_ADDRESSES));
  if (!localStorage.getItem(DB_KEYS.ORDERS))    localStorage.setItem(DB_KEYS.ORDERS,    JSON.stringify(DEFAULT_ORDERS));
  if (!localStorage.getItem('lm_notif'))        localStorage.setItem('lm_notif',         JSON.stringify(DEFAULT_NOTIFICATIONS));
  if (!localStorage.getItem('lm_stock'))        localStorage.setItem('lm_stock',         JSON.stringify({p1:24,p2:8,p3:15,p4:32,p5:67,p6:19,p7:11,p8:43,p9:5,p10:28,p11:3,p12:51}));
}


// ══════════════════════════════════════════
//  PRODUCTS CRUD
// ══════════════════════════════════════════
function getProducts() {
  // ► Real API: return fetch('/api/products').then(r=>r.json())
  return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
}

function saveProduct(product) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...product };
  } else {
    product.id = product.id || 'p_' + Date.now();
    products.push(product);
  }
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  return product;
}

function deleteProduct(id) {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
}

// ══════════════════════════════════════════
//  USERS CRUD
// ══════════════════════════════════════════
function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
}

function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

function updateUser(userId, changes) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) return null;
  users[idx] = { ...users[idx], ...changes };
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  return users[idx];
}

// ══════════════════════════════════════════
//  ADDRESSES CRUD
// ══════════════════════════════════════════
function getAddressesByUser(userId) {
  return JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]')
    .filter(a => a.user_id === userId);
}

function saveAddress(address) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]');
  address.id = address.id || 'a_' + Date.now();
  if (address.is_default) {
    // Снять is_default с остальных адресов пользователя
    all.forEach(a => { if (a.user_id === address.user_id) a.is_default = false; });
  }
  const idx = all.findIndex(a => a.id === address.id);
  if (idx >= 0) all[idx] = address; else all.push(address);
  localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
  return address;
}

function deleteAddress(id) {
  const all = JSON.parse(localStorage.getItem(DB_KEYS.ADDRESSES) || '[]').filter(a => a.id !== id);
  localStorage.setItem(DB_KEYS.ADDRESSES, JSON.stringify(all));
}

// ══════════════════════════════════════════
//  ORDERS (read-only for now)
// ══════════════════════════════════════════
function getOrdersByUser(userId) {
  return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]')
    .filter(o => o.user_id === userId);
}

// ══════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════
function login(email, password) {
  /**
   * ► Real API:
   *   return fetch('/api/auth/login', {
   *     method: 'POST',
   *     headers: {'Content-Type':'application/json'},
   *     body: JSON.stringify({email, password})
   *   }).then(r=>r.json())
   *
   * ⚠️  В продакшене: сервер сверяет bcrypt.compare(password, hash)
   *     Фронтенд НИКОГДА не должен знать хэш пароля!
   */
  const user = getUsers().find(u => u.email === email && u.password === password);
  if (!user) return { error: 'Неверный email или пароль' };
  const session = { userId: user.id, role: user.role, loginAt: new Date().toISOString() };
  localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
  return { success: true, user };
}

function logout() {
  localStorage.removeItem(DB_KEYS.SESSION);
}

function getSession() {
  return JSON.parse(localStorage.getItem(DB_KEYS.SESSION) || 'null');
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId);
}

// ══════════════════════════════════════════
//  AUTH — REGISTRATION
// ══════════════════════════════════════════
function register(fullName, email, password, phone) {
  /**
   * ► Real API:
   *   return fetch('/api/auth/register', {
   *     method: 'POST',
   *     headers: {'Content-Type':'application/json'},
   *     body: JSON.stringify({full_name, email, password, phone})
   *   }).then(r=>r.json())
   *
   * ⚠️  В продакшене: сервер хэширует пароль через bcrypt ПЕРЕД сохранением!
   */
  const existing = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) return { error: 'Пользователь с таким email уже существует' };
  if (!fullName || fullName.trim().length < 2) return { error: 'Введите имя (минимум 2 символа)' };
  if (!email.includes('@')) return { error: 'Введите корректный email' };
  if (password.length < 6) return { error: 'Пароль должен быть не менее 6 символов' };

  const newUser = {
    id: 'u_' + Date.now(),
    full_name: fullName.trim(),
    email: email.toLowerCase().trim(),
    password: password, // ⚠️ симуляция — в продакшене только bcrypt-хэш на сервере!
    phone: phone || '',
    avatar_url: '',
    role: 'customer',
    email_verified: false,
    created_at: new Date().toISOString(),
  };
  const users = getUsers();
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

  // Auto-login after registration
  const session = { userId: newUser.id, role: newUser.role, loginAt: new Date().toISOString() };
  localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(session));
  return { success: true, user: newUser };
}

// ══════════════════════════════════════════
//  WISHLIST
// ══════════════════════════════════════════
function getWishlist(userId) {
  const all = JSON.parse(localStorage.getItem('lm_wishlist') || '{}');
  return all[userId] || [];
}
function toggleWishlist(userId, productId) {
  const all = JSON.parse(localStorage.getItem('lm_wishlist') || '{}');
  const list = all[userId] || [];
  const idx = list.indexOf(productId);
  if (idx >= 0) list.splice(idx, 1); else list.push(productId);
  all[userId] = list;
  localStorage.setItem('lm_wishlist', JSON.stringify(all));
  return list.includes(productId);
}


// ══════════════════════════════════════════
//  ORDERS — ADMIN
// ══════════════════════════════════════════
function getAllOrders() {
  return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]')
    .sort((a,b) => new Date(b.date) - new Date(a.date));
}

function updateOrderStatus(orderId, status, track) {
  const orders = getAllOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return null;
  orders[idx] = { ...orders[idx], status, ...(track !== undefined ? { track } : {}) };
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  return orders[idx];
}

function deleteOrder(orderId) {
  const orders = getAllOrders().filter(o => o.id !== orderId);
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
}

// ══════════════════════════════════════════
//  STOCK
// ══════════════════════════════════════════
function getStock() {
  return JSON.parse(localStorage.getItem('lm_stock') || '{}');
}
function setStock(productId, qty) {
  const stock = getStock();
  stock[productId] = parseInt(qty) || 0;
  localStorage.setItem('lm_stock', JSON.stringify(stock));
}

// ══════════════════════════════════════════
//  USERS — ADMIN
// ══════════════════════════════════════════
function updateUserRole(userId, role) {
  return updateUser(userId, { role });
}
function toggleUserBan(userId) {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser(userId, { banned: !user.banned });
}

// ══════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════
function getNotifications() {
  return JSON.parse(localStorage.getItem('lm_notif') || '[]');
}
function markNotifRead(id) {
  const notifs = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem('lm_notif', JSON.stringify(notifs));
}
function addNotification(type, msg) {
  const notifs = getNotifications();
  notifs.unshift({ id: 'n_'+Date.now(), type, msg, time: new Date().toISOString(), read: false });
  localStorage.setItem('lm_notif', JSON.stringify(notifs.slice(0,50)));
}

// ── Export for module environments (remove if using plain <script>) ─
if (typeof module !== 'undefined') {
  module.exports = { initDb, getProducts, saveProduct, deleteProduct, getUsers, getUserById, updateUser, updateUserRole, toggleUserBan, getAddressesByUser, saveAddress, deleteAddress, getOrdersByUser, getAllOrders, updateOrderStatus, deleteOrder, getStock, setStock, login, logout, getSession, getCurrentUser, register, getWishlist, toggleWishlist, getNotifications, markNotifRead, addNotification };
}

// Auto-init
initDb();
