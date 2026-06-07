/* ══ LUMIÈRE — Secure Site JS ══════════════════ */
'use strict';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const PRODUCT_DB = {};

async function syncProductDb() {
  try {
    const products = await getProducts();
    if (Array.isArray(products)) {
      products.forEach(p => { PRODUCT_DB[p.id] = p; });
    }
  } catch (e) {
    console.error('Failed to sync products:', e);
  }
}

function addFeatured() {
  PRODUCT_DB['f1'] = {
    id: 'f1',
    brand: 'La Mer',
    name: 'Crème de la Mer',
    price: 128000,
    oldPrice: null,
    badge: 'Bestseller',
    stars: '★★★★★',
    reviews: 1842,
    art: 'fpi-1 pa',
    desc: 'Легендарный крем',
  };
  PRODUCT_DB['f2'] = {
    id: 'f2',
    brand: 'Charlotte Tilbury',
    name: 'Pillow Talk Palette',
    price: 54900,
    oldPrice: null,
    badge: 'New',
    stars: '★★★★★',
    reviews: 967,
    art: 'fpi-2',
    desc: 'Культовая палетка',
  };
  PRODUCT_DB['f3'] = {
    id: 'f3',
    brand: 'Jo Malone',
    name: 'English Pear & Freesia',
    price: 89000,
    oldPrice: null,
    badge: 'Limited',
    stars: '★★★★☆',
    reviews: 534,
    art: 'fpi-3',
    desc: 'Элегантный парфюм',
  };
}

let cart = [];
let modalQty = 1;
let modalProductId = null;

async function initAuthUI() {
  try {
    const sess = getSession();
    if (!sess) return;
    
    const user = await getCurrentUser();
    const dot = document.getElementById('navUserDot');
    const adminBtn = document.getElementById('navAdminBtn');
    
    if (dot) dot.style.display = 'block';
    if (user && user.role === 'admin' && adminBtn) {
      adminBtn.style.display = 'flex';
    }
    
    const profBtn = document.getElementById('navProfileBtn');
    if (profBtn && user) {
      profBtn.title = escapeHtml(user.full_name);
    }
  } catch (e) {
    console.error('Auth UI init error:', e);
  }
}

function fmt(n) {
  return '₸ ' + n.toLocaleString('ru-KZ');
}

function toast(msg, icon = '✓') {
  const t = document.createElement('div');
  t.className = 'toast';
  
  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  iconEl.textContent = icon;
  
  const msgEl = document.createElement('span');
  msgEl.textContent = msg;
  
  t.appendChild(iconEl);
  t.appendChild(msgEl);
  
  const container = document.getElementById('toastContainer');
  if (container) {
    container.appendChild(t);
    setTimeout(() => t.style.opacity = '0', 2800);
    setTimeout(() => t.remove(), 3200);
  }
}

async function addToCart(productId, qty = 1) {
  await syncProductDb();
  const p = PRODUCT_DB[productId];
  if (!p) return;
  
  qty = Math.max(1, Math.min(10, parseInt(qty) || 1));
  
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty = Math.min(10, existing.qty + qty);
  } else {
    cart.push({ ...p, qty });
  }
  
  updateCartUI();
  toast(`${escapeHtml(p.name)} добавлен в корзину`);
}

function removeFromCart(productId) {
  if (!productId || typeof productId !== 'string') return;
  cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const badge = document.getElementById('cartBadge');
  const lbl = document.getElementById('cartCountLabel');
  
  if (badge) {
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = count;
  }
  
  if (lbl) {
    lbl.textContent = `${count} ${count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'}`;
  }

  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  if (cart.length === 0) {
    if (empty) empty.style.display = 'flex';
    if (footer) footer.style.display = 'none';
    if (container) container.innerHTML = '';
  } else {
    if (empty) empty.style.display = 'none';
    if (footer) footer.style.display = 'flex';
    if (container) {
      container.innerHTML = '';
      cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        
        const imgEl = document.createElement('div');
        imgEl.className = `ci-img pa ${item.art || 'pa-serum'}`;
        
        const infoEl = document.createElement('div');
        infoEl.className = 'ci-info';
        
        const brandEl = document.createElement('p');
        brandEl.className = 'ci-brand';
        brandEl.textContent = escapeHtml(item.brand);
        
        const nameEl = document.createElement('p');
        nameEl.className = 'ci-name';
        nameEl.textContent = escapeHtml(item.name);
        
        const priceEl = document.createElement('p');
        priceEl.className = 'ci-price';
        priceEl.textContent = `${fmt(item.price)} × ${item.qty}`;
        
        infoEl.appendChild(brandEl);
        infoEl.appendChild(nameEl);
        infoEl.appendChild(priceEl);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'ci-remove';
        removeBtn.textContent = '✕';
        removeBtn.dataset.id = item.id;
        removeBtn.addEventListener('click', () => removeFromCart(item.id));
        
        div.appendChild(imgEl);
        div.appendChild(infoEl);
        div.appendChild(removeBtn);
        container.appendChild(div);
      });
    }
  }
  
  if (totalEl) totalEl.textContent = fmt(total);
}

function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCartFn() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
}

const openCartBtn = document.getElementById('openCart');
const closeCartBtn = document.getElementById('closeCart');
if (openCartBtn) openCartBtn.addEventListener('click', openCart);
if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartFn);

function openQuickView(productId) {
  const p = PRODUCT_DB[productId];
  if (!p) return;
  
  modalProductId = productId;
  modalQty = 1;
  
  const els = {
    modalBrand: document.getElementById('modalBrand'),
    modalName: document.getElementById('modalName'),
    modalStars: document.getElementById('modalStars'),
    modalReviews: document.getElementById('modalReviews'),
    modalPrice: document.getElementById('modalPrice'),
    modalDesc: document.getElementById('modalDesc'),
    modalBadge: document.getElementById('modalBadge'),
    qtyNum: document.querySelector('.qty-num'),
    modalImg: document.getElementById('modalImg'),
  };
  
  if (els.modalBrand) els.modalBrand.textContent = escapeHtml(p.brand);
  if (els.modalName) els.modalName.textContent = escapeHtml(p.name);
  if (els.modalStars) els.modalStars.textContent = p.stars || '★★★★★';
  if (els.modalReviews) els.modalReviews.textContent = `(${(p.reviews || 0).toLocaleString()} отзывов)`;
  if (els.modalPrice) els.modalPrice.textContent = fmt(p.price);
  if (els.modalDesc) els.modalDesc.textContent = escapeHtml(p.desc || '');
  if (els.modalBadge) els.modalBadge.textContent = escapeHtml(p.badge || '');
  if (els.qtyNum) els.qtyNum.textContent = 1;

  if (els.modalImg) {
    els.modalImg.className = `modal-img pa ${p.art || 'pa-serum'}`;
  }

  const backdrop = document.getElementById('modalBackdrop');
  const overlay = document.getElementById('overlay');
  if (backdrop) backdrop.classList.add('show');
  if (overlay) overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('modalBackdrop');
  const overlay = document.getElementById('overlay');
  if (backdrop) backdrop.classList.remove('show');
  if (overlay) overlay.classList.remove('show');
  document.body.style.overflow = '';
}

const modalClose = document.getElementById('modalClose');
const backdrop = document.getElementById('modalBackdrop');
const modalAddBtn = document.getElementById('modalAddBtn');

if (modalClose) modalClose.addEventListener('click', closeModal);
if (backdrop) {
  backdrop.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
}
if (modalAddBtn) {
  modalAddBtn.addEventListener('click', () => {
    if (!modalProductId) return;
    addToCart(modalProductId, modalQty);
    closeModal();
    setTimeout(openCart, 300);
  });
}

const qtyDec = document.querySelector('.qty-dec');
const qtyInc = document.querySelector('.qty-inc');
if (qtyDec) {
  qtyDec.addEventListener('click', () => {
    modalQty = Math.max(1, modalQty - 1);
    const qtyNum = document.querySelector('.qty-num');
    if (qtyNum) qtyNum.textContent = modalQty;
  });
}
if (qtyInc) {
  qtyInc.addEventListener('click', () => {
    modalQty = Math.min(10, modalQty + 1);
    const qtyNum = document.querySelector('.qty-num');
    if (qtyNum) qtyNum.textContent = modalQty;
  });
}

let shownCount = 8;
let activeFilter = 'all';

async function renderProducts() {
  try {
    await syncProductDb();
    const PRODUCTS = await getProducts();
    if (!Array.isArray(PRODUCTS)) return;
    
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    const filtered = activeFilter === 'all'
      ? PRODUCTS
      : PRODUCTS.filter(p => p.cat === activeFilter);
    const visible = filtered.slice(0, shownCount);
    grid.innerHTML = '';

    visible.forEach((p, i) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.style.animationDelay = (i % 4) * 0.07 + 's';

      let badgeHTML = '';
      if (p.badge === 'new') badgeHTML = `<span class="pc-badge badge-new">New</span>`;
      else if (p.badge === 'sale') badgeHTML = `<span class="pc-badge badge-sale">Sale</span>`;
      else if (p.badge === 'hit') badgeHTML = `<span class="pc-badge badge-hit">★ Хит</span>`;

      let priceHTML = `<span class="pc-price">${fmt(p.price)}</span>`;
      if (p.oldPrice) priceHTML += `<span class="pc-price-old">${fmt(p.oldPrice)}</span>`;

      let innerArt = '';
      const colors = Array.isArray(p.colors) ? p.colors : [];
      if (p.art === 'pa-palette' && colors.length) {
        innerArt = `<div class="pa-palette">${colors
          .map(c => `<span style="background:${escapeHtml(c)}"></span>`)
          .join('')}</div>`;
      }

      card.innerHTML = `
        <div class="pc-img">
          <div class="pa ${p.art}">${innerArt}</div>
          ${badgeHTML}
          <button class="pc-wishlist" data-id="${escapeHtml(p.id)}" aria-label="Добавить в избранное">♡</button>
          <button class="pc-quick-view" data-id="${escapeHtml(p.id)}">Быстрый просмотр</button>
        </div>
        <div class="pc-body">
          <p class="pc-brand">${escapeHtml(p.brand)}</p>
          <p class="pc-stars">${p.stars}</p>
          <p class="pc-name">${escapeHtml(p.name)}</p>
          <div class="pc-bottom">
            <div>${priceHTML}</div>
            <button class="pc-add" data-id="${escapeHtml(p.id)}" aria-label="В корзину">+</button>
          </div>
        </div>
      `;

      card.querySelector('.pc-add').addEventListener('click', e => {
        e.stopPropagation();
        addToCart(p.id);
      });
      card.querySelector('.pc-quick-view').addEventListener('click', e => {
        e.stopPropagation();
        openQuickView(p.id);
      });

      grid.appendChild(card);
    });

    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = filtered.length > shownCount ? 'inline-flex' : 'none';
  } catch (e) {
    console.error('Render products error:', e);
  }
}

const filterTabs = document.getElementById('filterTabs');
if (filterTabs) {
  filterTabs.addEventListener('click', e => {
    if (!e.target.matches('.ftab')) return;
    document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active-ftab'));
    e.target.classList.add('active-ftab');
    activeFilter = e.target.dataset.filter;
    shownCount = 8;
    renderProducts();
  });
}

const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    shownCount += 4;
    renderProducts();
  });
}

async function initApp() {
  try {
    await initAuthUI();
    await syncProductDb();
    addFeatured();
    await renderProducts();
    updateCartUI();
  } catch (e) {
    console.error('[LUMIÈRE] Init error:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

console.log('%c✦ LUMIÈRE Secure', 'font-family:serif;font-size:24px;color:#D4907E');
console.log('%cXSS Protection Enabled', 'font-size:12px;color:#90EE90');
