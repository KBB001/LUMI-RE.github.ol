/* ══ LUMIÈRE — Site JS ══════════════════ */
'use strict';

// ─── Product Data (from db.js) ───────────────────
// db.js is loaded before site.js and provides:
// getProducts(), getCurrentUser(), getSession(), login(), logout() etc.

const PRODUCT_DB = {};

async function syncProductDb(){
  const products = await getProducts();
  if (Array.isArray(products)) products.forEach(p => { PRODUCT_DB[p.id] = p; });
}

// Featured items (static, always available)
function addFeatured(){
  PRODUCT_DB['f1'] = { id:'f1', brand:'La Mer', name:'Crème de la Mer', price:128000, oldPrice:null, badge:'Bestseller', stars:'★★★★★', reviews:1842, art:'fpi-1 pa', desc:'Легендарный крем с запатентованным Miracle Broth™. Исцеляет, увлажняет и омолаживает кожу. Говорят, что именно его наносят перед красной дорожкой.', colors:[] };
  PRODUCT_DB['f2'] = { id:'f2', brand:'Charlotte Tilbury', name:'Pillow Talk Palette', price:54900, oldPrice:null, badge:'New', stars:'★★★★★', reviews:967, art:'fpi-2', desc:'Культовая палетка в оттенках Pillow Talk: нюдовые румяна, хайлайтер, бронзер и 8 теней. Для безупречного макияжа.', colors:[] };
  PRODUCT_DB['f3'] = { id:'f3', brand:'Jo Malone', name:'English Pear & Freesia', price:89000, oldPrice:null, badge:'Limited', stars:'★★★★☆', reviews:534, art:'fpi-3', desc:'Элегантный британский парфюм с нотами свежей груши, белой амбры и нарцисса. Именно этим ароматом заканчивается лето.', colors:[] };
}


// ─── Cart State ──────────────────────
let cart = [];
let modalQty = 1;
let modalProductId = null;

// ─── Session-aware navbar ─────────────
async function initAuthUI(){
  try {
    const sess = getSession();
    if(!sess) return;
    const user = await getUserById(sess.userId);
    const dot = document.getElementById('navUserDot');
    const adminBtn = document.getElementById('navAdminBtn');
    if (dot) dot.style.display = 'block';
    if (user && user.role === 'admin' && adminBtn) adminBtn.style.display = 'flex';
    // Update navbar profile icon title with user name
    const profBtn = document.getElementById('navProfileBtn');
    if(profBtn && user) profBtn.title = user.full_name;
  } catch(e) { /* db.js not loaded, skip */ }
}


// ─── Helpers ─────────────────────────
function fmt(n){ return '₸ ' + n.toLocaleString('ru-KZ'); }

function toast(msg, icon='✓'){
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.style.opacity='0', 2800);
  setTimeout(() => t.remove(), 3200);
}

// ─── Cart ────────────────────────────
async function addToCart(productId, qty=1){
  await syncProductDb(); // ensure latest products are in PRODUCT_DB
  const p = PRODUCT_DB[productId];
  if(!p) return;
  const existing = cart.find(i => i.id === productId);
  if(existing){ existing.qty += qty; }
  else { cart.push({...p, qty}); }
  updateCartUI();
  toast(`${p.name} добавлен в корзину`);
}

function removeFromCart(productId){
  cart = cart.filter(i => i.id !== productId);
  updateCartUI();
}

function updateCartUI(){
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s,i) => s + i.qty, 0);

  // Badge
  const badge = document.getElementById('cartBadge');
  const lbl = document.getElementById('cartCountLabel');
  badge.style.display = count > 0 ? 'flex' : 'none';
  badge.textContent = count;
  lbl.textContent = `${count} ${count===1?'товар':count<5?'товара':'товаров'}`;

  // Items
  const container = document.getElementById('cartItems');
  const empty = document.getElementById('cartEmpty');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  if(cart.length === 0){
    empty.style.display = 'flex';
    footer.style.display = 'none';
    container.innerHTML = '';
    container.appendChild(empty);
  } else {
    empty.style.display = 'none';
    footer.style.display = 'flex';
    container.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="ci-img pa ${item.art||'pa-serum'}"></div>
        <div class="ci-info">
          <p class="ci-brand">${item.brand}</p>
          <p class="ci-name">${item.name}</p>
          <p class="ci-price">${fmt(item.price)} × ${item.qty}</p>
        </div>
        <button class="ci-remove" data-id="${item.id}">✕</button>
      `;
      div.querySelector('.ci-remove').addEventListener('click', () => removeFromCart(item.id));
      container.appendChild(div);
    });
  }
  totalEl.textContent = fmt(total);
}

// ─── Cart Sidebar ────────────────────
function openCart(){ 
  document.getElementById('cartSidebar').classList.add('open');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeCartFn(){
  document.getElementById('cartSidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}
document.getElementById('openCart').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCartFn);

// ─── Quick View Modal ────────────────
function openQuickView(productId){
  const p = PRODUCT_DB[productId];
  if(!p) return;
  modalProductId = productId;
  modalQty = 1;
  document.getElementById('modalBrand').textContent = p.brand;
  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalStars').textContent = p.stars || '★★★★★';
  document.getElementById('modalReviews').textContent = `(${(p.reviews||0).toLocaleString()} отзывов)`;
  document.getElementById('modalPrice').textContent = fmt(p.price);
  document.getElementById('modalDesc').textContent = p.desc || '';
  document.getElementById('modalBadge').textContent = p.badge || '';
  document.querySelector('.qty-num').textContent = 1;

  // Art in modal
  const img = document.getElementById('modalImg');
  img.className = `modal-img pa ${p.art || 'pa-serum'}`;

  // Palette colors
  const pColors = Array.isArray(p.colors) ? p.colors : [];
  if(pColors.length){
    const pal = img.querySelector('.pa-palette');
    if(pal){ pal.querySelectorAll('span').forEach((s,i) => { s.style.background = pColors[i] || '#ccc'; }); }
  }

  document.getElementById('modalBackdrop').classList.add('show');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  document.getElementById('modalBackdrop').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => { if(e.target === e.currentTarget) closeModal(); });

document.getElementById('modalAddBtn').addEventListener('click', () => {
  if(!modalProductId) return;
  addToCart(modalProductId, modalQty);
  closeModal();
  setTimeout(openCart, 300);
});

// Qty stepper in modal
document.querySelector('.qty-dec').addEventListener('click', () => {
  modalQty = Math.max(1, modalQty - 1);
  document.querySelector('.qty-num').textContent = modalQty;
});
document.querySelector('.qty-inc').addEventListener('click', () => {
  modalQty = Math.min(10, modalQty + 1);
  document.querySelector('.qty-num').textContent = modalQty;
});

// overlay click closes both
document.getElementById('overlay').addEventListener('click', () => {
  closeCartFn();
  closeModal();
  closeMobileNav();
});

// ─── Render Products ─────────────────
let shownCount = 8;
let activeFilter = 'all';

async function renderProducts(){
  await syncProductDb(); // always pull latest from db.js
  const PRODUCTS = await getProducts();
  if(!Array.isArray(PRODUCTS)) return;
  
  const grid = document.getElementById('productsGrid');
  const filtered = activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === activeFilter);
  const visible = filtered.slice(0, shownCount);
  grid.innerHTML = '';

  visible.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = (i % 4) * 0.07 + 's';

    let badgeHTML = '';
    if(p.badge === 'new') badgeHTML = `<span class="pc-badge badge-new">New</span>`;
    else if(p.badge === 'sale') badgeHTML = `<span class="pc-badge badge-sale">Sale</span>`;
    else if(p.badge === 'hit') badgeHTML = `<span class="pc-badge badge-hit">★ Хит</span>`;

    let priceHTML = `<span class="pc-price">${fmt(p.price)}</span>`;
    if(p.oldPrice) priceHTML += `<span class="pc-price-old">${fmt(p.oldPrice)}</span>`;

    // build palette spans for palette art
    let innerArt = '';
    const colors = Array.isArray(p.colors) ? p.colors : [];
    if(p.art === 'pa-palette' && colors.length){
      innerArt = `<div class="pa-palette">${colors.map(c=>`<span style="background:${c}"></span>`).join('')}</div>`;
    }

    card.innerHTML = `
      <div class="pc-img">
        <div class="pa ${p.art}">${innerArt}</div>
        ${badgeHTML}
        <button class="pc-wishlist" data-id="${p.id}" aria-label="Добавить в избранное">♡</button>
        <button class="pc-quick-view" data-id="${p.id}">Быстрый просмотр</button>
      </div>
      <div class="pc-body">
        <p class="pc-brand">${p.brand}</p>
        <p class="pc-stars">${p.stars}</p>
        <p class="pc-name">${p.name}</p>
        <div class="pc-bottom">
          <div>${priceHTML}</div>
          <button class="pc-add" data-id="${p.id}" aria-label="В корзину">+</button>
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
    card.querySelector('.pc-wishlist').addEventListener('click', async function(e){
      e.stopPropagation();
      try {
        const sess = getSession();
        if(sess) {
          const inWish = await toggleWishlist(sess.userId, p.id);
          this.classList.toggle('wished', inWish);
          this.textContent = inWish ? '♥' : '♡';
        } else {
          // Not logged in — just toggle visually and hint
          this.classList.toggle('wished');
          this.textContent = this.classList.contains('wished') ? '♥' : '♡';
          if(this.classList.contains('wished')) toast('Войдите, чтобы сохранить избранное', '💛');
        }
      } catch(err){
        this.classList.toggle('wished');
        this.textContent = this.classList.contains('wished') ? '♥' : '♡';
      }
    });

    grid.appendChild(card);
  });

  const btn = document.getElementById('loadMoreBtn');
  btn.style.display = filtered.length > shownCount ? 'inline-flex' : 'none';

  // Restore wishlist state async
  try {
    const sess = getSession();
    if(sess) {
      const wish = await getWishlist(sess.userId);
      visible.forEach(p => {
        if(wish.includes(p.id)){
          const btn = Array.from(grid.querySelectorAll('.pc-wishlist')).find(b => b.dataset.id == p.id);
          if(btn) { btn.classList.add('wished'); btn.textContent='♥'; }
        }
      });
    }
  } catch(e){}
}

// Filter tabs
document.getElementById('filterTabs').addEventListener('click', e => {
  if(!e.target.matches('.ftab')) return;
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active-ftab'));
  e.target.classList.add('active-ftab');
  activeFilter = e.target.dataset.filter;
  shownCount = 8;
  renderProducts();
});

document.getElementById('loadMoreBtn').addEventListener('click', () => {
  shownCount += 4;
  renderProducts();
});

// ─── Navbar ──────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Search
document.getElementById('searchToggle').addEventListener('click', () => {
  document.getElementById('searchBarFull').classList.toggle('open');
  document.getElementById('searchInput').focus();
});
document.getElementById('searchClose').addEventListener('click', () => {
  document.getElementById('searchBarFull').classList.remove('open');
});

// Burger / mobile nav
function openMobileNav(){
  document.getElementById('mobileNav').classList.add('open');
  document.getElementById('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav(){
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
  document.body.style.overflow = '';
}
document.getElementById('burger').addEventListener('click', openMobileNav);
document.getElementById('mobileNavClose').addEventListener('click', closeMobileNav);
document.querySelectorAll('.mnl').forEach(a => a.addEventListener('click', closeMobileNav));

// ─── Testimonials carousel ───────────
const track = document.getElementById('testimonialsTrack');
const cards = track ? track.querySelectorAll('.testi-card') : [];
const dotsContainer = document.getElementById('testiDots');
let testiIdx = 0;

if (dotsContainer) {
  cards.forEach((_,i) => {
    const d = document.createElement('button');
    d.className = 'td' + (i===0?' active':'');
    d.addEventListener('click', () => scrollToTesti(i));
    dotsContainer.appendChild(d);
  });
}

function scrollToTesti(idx){
  if(cards.length === 0) return;
  testiIdx = Math.max(0, Math.min(idx, cards.length-1));
  const card = cards[testiIdx];
  track.scrollTo({ left: card.offsetLeft - 60, behavior: 'smooth' });
  if (dotsContainer) dotsContainer.querySelectorAll('.td').forEach((d,i) => d.classList.toggle('active', i===testiIdx));
}

const testiPrev = document.getElementById('testiPrev');
const testiNext = document.getElementById('testiNext');
if (testiPrev) testiPrev.addEventListener('click', () => scrollToTesti(testiIdx-1));
if (testiNext) testiNext.addEventListener('click', () => scrollToTesti(testiIdx+1));

// ─── Newsletter ───────────────────────
function submitNewsletter(e){
  e.preventDefault();
  const form = document.getElementById('nlForm');
  if(form) {
    form.innerHTML = `<p style="color:var(--blush);font-family:var(--font-s);font-size:22px;text-align:center">
      ✓ Вы подписаны!<br/><span style="font-size:14px;color:rgba(248,242,234,.5);font-family:var(--font-u)">Спасибо, следите за новинками</span>
    </p>`;
  }
}
window.submitNewsletter = submitNewsletter;

// ─── Kaspi / Halyk checkout ───────────
function checkoutKaspi(){
  const total = cart.reduce((s,i) => s+i.price*i.qty, 0);
  if(!total){ toast('Корзина пуста'); return; }
  toast(`Переход на Kaspi.kz · ${fmt(total)}`);
}
function checkoutHalyk(){
  const total = cart.reduce((s,i) => s+i.price*i.qty, 0);
  if(!total){ toast('Корзина пуста'); return; }
  toast(`Переход на Halyk Pay · ${fmt(total)}`);
}
window.checkoutKaspi = checkoutKaspi;
window.checkoutHalyk = checkoutHalyk;
window.openQuickView = openQuickView;

// ─── Scroll animations ────────────────
const revealEls = document.querySelectorAll('.featured-card, .product-card, .testi-card, .stat-item, .brand-logo-item, .pay-badge');
const ro = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if(en.isIntersecting){
      en.target.classList.add('revealed');
      ro.unobserve(en.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => {
  el.style.opacity='0';
  el.style.transform='translateY(20px)';
  el.style.transition='opacity .5s ease, transform .5s cubic-bezier(.34,1.56,.64,1)';
  ro.observe(el);
});
document.head.insertAdjacentHTML('beforeend', '<style>.revealed{opacity:1!important;transform:none!important}</style>');

// ─── Parallax hero ────────────────────
const heroVis = document.getElementById('heroVisual');
window.addEventListener('scroll', () => {
  if(heroVis && window.scrollY < window.innerHeight){
    heroVis.style.transform = `translateY(${window.scrollY * 0.12}px)`;
  }
}, { passive: true });

// ─── Init ─────────────────────────────
async function initApp() {
  await initAuthUI();
  await syncProductDb();
  addFeatured();
  await renderProducts();
  updateCartUI();
}
initApp();

console.log('%c✦ LUMIÈRE', 'font-family:serif;font-size:24px;color:#D4907E');
console.log('%cLuxury Beauty · Kazakhstan · ₸ KZT', 'font-size:12px;color:#8C6E60');
