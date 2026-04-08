/* ============================================================
   Abu. Goush — Full Application Logic
   ============================================================ */

// ── Config ──────────────────────────────────────────────────
const API = 'https://dominica-elusive-danial.ngrok-free.dev/api/v1';

// ── State ───────────────────────────────────────────────────
const state = {
  token: localStorage.getItem('pos_token') || null,
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  role: localStorage.getItem('pos_role') || null,
  branches: [],
  selectedBranch: null,
  currentRoute: 'dashboard',
  cart: [],
  cartTable: null,
  categories: [],
  products: [],
  sizes: [],
  extras: [],
  menuItems: [],
  tables: [],
  orders: [],
  users: [],
  completedOrders: [],
  historyPage: 1,
  historyPageSize: 10,
};

// ── API Service ─────────────────────────────────────────────
const api = {
  async req(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    if (res.status === 204) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || res.statusText);
    }
    return res.json();
  },
  get: (p) => api.req('GET', p),
  post: (p, b) => api.req('POST', p, b),
  put: (p, b) => api.req('PUT', p, b),
  patch: (p, b) => api.req('PATCH', p, b),
  del: (p) => api.req('DELETE', p),

  async login(username, password) {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },
  // ── NEW: Excel download helper ─────────────────────────────
  async downloadExcel(path, filename) {
    try {
      const headers = { Authorization: `Bearer ${state.token}` };
      const res = await fetch(`${API}${path}`, { method: 'GET', headers });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast('✅ Excel file downloaded', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  },
};
// ── Utility ─────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const html = (el, h) => { el.innerHTML = h; };
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

function toast(msg, type = 'success') {
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
// ── ENHANCED CONFIRM POP-UP (replaces all native confirm()) ─────────────────────
async function confirmAction(title, message, options = {}) {
  const { confirmText = 'Confirm', cancelText = 'Cancel', danger = true } = options;

  return new Promise((resolve) => {
    const content = `
      <div style="padding:32px 24px; text-align:center;">
        <div style="font-size:3.5rem; margin-bottom:16px;">${danger ? '⚠️' : '❓'}</div>
        <h3 style="margin-bottom:8px;">${title}</h3>
        <p style="color:#555; font-size:1rem; margin-bottom:28px; max-width:340px;">${message}</p>
        <div style="display:flex; gap:16px; justify-content:center;">
          <button id="confirm-cancel-btn" class="btn btn-outline">${cancelText}</button>
          <button id="confirm-proceed-btn" class="btn btn-${danger ? 'danger' : 'primary'}">${confirmText}</button>
        </div>
      </div>
    `;

    showModal(title, content);

    setTimeout(() => {
      const proceed = document.getElementById('confirm-proceed-btn');
      const cancel = document.getElementById('confirm-cancel-btn');
      const closeBtn = document.getElementById('modal-close-btn');

      const doResolve = (val) => {
        closeModal();
        resolve(val);
      };

      proceed?.addEventListener('click', () => doResolve(true));
      cancel?.addEventListener('click', () => doResolve(false));

      // X button & overlay click = cancel
      if (closeBtn) closeBtn.addEventListener('click', () => doResolve(false));
      $('#modal-overlay').addEventListener('click', (e) => {
        if (e.target === $('#modal-overlay')) doResolve(false);
      });
    }, 30);
  });
}
function formatMoney(n) {
  return parseFloat(n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function isAdmin() { return state.role === 'admin' || state.role === 'admin'; }
function isCashier() { return state.role === 'cashier' || state.role === 'cashier'; }

// ── Auth ────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const errEl = $('#login-error');
  hide(errEl);
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  if (!username || !password) {
    show(errEl);
    errEl.textContent = 'Please enter username and password.';
    return;
  }
  try {
    const data = await api.login(username, password);
    state.token = data.access_token;
    localStorage.setItem('pos_token', data.access_token);
    // Fetch profile
    const profile = await api.get('/auth/profile');
    state.user = profile;
    state.role = profile.role;
    localStorage.setItem('pos_user', JSON.stringify(profile));
    localStorage.setItem('pos_role', profile.role);
    enterApp();
  } catch (err) {
    show(errEl);
    errEl.textContent = err.message;
  }
}

function logout() {
  state.token = null;
  state.user = null;
  state.role = null;
  state.cart = [];
  state.cartTable = null;
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  localStorage.removeItem('pos_role');
  hide($('#app-shell'));
  show($('#login-screen'));
  $('#login-screen').classList.add('active');
  $('#login-username').value = '';
  $('#login-password').value = '';
  $('#login-username').focus();
}

$('#password-toggle').addEventListener('click', () => {
  const inp = $('#login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

$('#login-form').addEventListener('submit', handleLogin);
$('#logout-btn').addEventListener('click', logout);

// ── Navigation ──────────────────────────────────────────────
const NAV_CASHIER = [
  { section: 'Workspace' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'pos', label: 'New Order', icon: '🛒' },
  { id: 'orders', label: 'Active Orders', icon: '📋' },
  { id: 'tables', label: 'Tables', icon: '🪑' },
  { id: 'history', label: 'Order History', icon: '📜' },
  { section: 'Account' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

const NAV_ADMIN = [
  { section: 'Overview' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { section: 'POS' },
  // ── New Order is hidden for admins (they are not allowed) ──
  // { id: 'pos', label: 'New Order', icon: '🛒' },
  { id: 'orders', label: 'Active Orders', icon: '📋' },
  { id: 'tables', label: 'Tables', icon: '🪑' },
  { id: 'history', label: 'Order History', icon: '📜' },
  { section: 'Management' },
  { id: 'branches', label: 'Branches', icon: '🏢' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'categories', label: 'Categories', icon: '📁' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'sizes', label: 'Sizes', icon: '📏' },
  { id: 'extras', label: 'Extras', icon: '✨' },
  { id: 'menu-items', label: 'Menu Items', icon: '🍽' },
  { section: 'Account' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];
function buildSidebar() {
  const nav = $('#sidebar-nav');
  const items = isAdmin() ? NAV_ADMIN : NAV_CASHIER;
  let h = '';
  for (const item of items) {
    if (item.section) {
      h += `<div class="nav-section">${item.section}</div>`;
    } else {
      h += `<div class="nav-item ${state.currentRoute === item.id ? 'active' : ''}" data-route="${item.id}">
        <span class="nav-icon">${item.icon}</span>${item.label}
      </div>`;
    }
  }
  html(nav, h);
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.route));
  });
}

function navigate(route) {
  // ── SECURITY: Prevent admins from accessing New Order page ──
  if (route === 'pos' && isAdmin()) {
    toast('Admins are not allowed to create new orders.', 'warning');
    route = 'dashboard';           // redirect to safe page
  }

  state.currentRoute = route;
  buildSidebar();
  renderPage();
}

// ── Enter App ───────────────────────────────────────────────
async function enterApp() {
  $('#login-screen').classList.remove('active');
  hide($('#login-screen'));
  show($('#app-shell'));

  // Topbar user
  const u = state.user;
  html($('#topbar-user'), `<div class="user-avatar">${(u.username || '?')[0].toUpperCase()}</div>${u.username}`);
  html($('#sidebar-user'), `<div>${u.username}</div><div class="user-role">${u.role}</div>`);

  // Load branches
  try {
    state.branches = await api.get('/branches/');
    if (state.branches.length) {
      state.selectedBranch = state.user.branch_id || state.branches[0].id;
    }
  } catch { state.branches = []; }

  // Branch selector
  if (isAdmin() && state.branches.length) {
    show($('#branch-selector'));
    const sel = $('#branch-select');
    html(sel, state.branches.map(b =>
      `<option value="${b.id}" ${b.id === state.selectedBranch ? 'selected' : ''}>${b.name}</option>`
    ).join(''));
    sel.addEventListener('change', (e) => {
      state.selectedBranch = parseInt(e.target.value);
      renderPage();
    });
  } else {
    hide($('#branch-selector'));
    if (state.user.branch_id) state.selectedBranch = state.user.branch_id;
  }

  buildSidebar();
  navigate('dashboard');
}

// ── Page Router ─────────────────────────────────────────────
function renderPage() {
  const content = $('#content');
  const route = state.currentRoute;

  // ── BLOCK ADMIN from New Order page even if they force the route ──
  if (route === 'pos' && isAdmin()) {
    html(content, `
      <div class="empty-state" style="margin-top:80px;">
        <div class="empty-icon" style="font-size:4rem;">🚫</div>
        <h3>Access Denied</h3>
        <p>Administrators are not permitted to create new orders.</p>
        <button class="btn btn-primary" onclick="navigate('dashboard')">Go to Dashboard</button>
      </div>
    `);
    return;
  }

  const pages = {
    dashboard: renderDashboard,
    pos: renderPOS,
    orders: renderOrders,
    tables: renderTables,
    history: renderHistory,
    profile: renderProfile,
    branches: renderBranches,
    users: renderUsers,
    categories: renderCategories,
    products: renderProducts,
    sizes: renderSizes,
    extras: renderExtras,
    'menu-items': renderMenuItems,
  };

  const renderer = pages[route];
  if (renderer) renderer(content);
  else html(content, '<div class="empty-state"><div class="empty-icon">🔍</div><p>Page not found</p></div>');
}
// ── Dashboard ───────────────────────────────────────────────


async function renderDashboard(el) {
  if (isAdmin()) {
    html(el, `
      <div class="page-header"><h2>Admin Dashboard</h2></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Branches</div><div class="stat-value" id="dash-branches">—</div></div>
        <div class="stat-card"><div class="stat-label">Orders Today</div><div class="stat-value" id="dash-orders">—</div></div>
        <div class="stat-card"><div class="stat-label">Active Users</div><div class="stat-value" id="dash-users">—</div></div>
        <div class="stat-card"><div class="stat-label">Menu Items</div><div class="stat-value" id="dash-menu">—</div></div>
      </div>
      <div class="card"><div class="card-header">Recent Activity</div><div class="card-body" id="dash-activity"><div class="loading-center"><div class="spinner"></div></div></div></div>
    `);
    try {
      const [branches, orders, menuItems] = await Promise.all([
        api.get('/branches/'),
        state.selectedBranch ? api.get(`/orders/?branch_id=${state.selectedBranch}`) : Promise.resolve([]),
        api.get('/menu-items/').catch(() => []),
      ]);
      $('#dash-branches').textContent = branches.length;
      $('#dash-orders').textContent = orders.length;
      $('#dash-menu').textContent = menuItems.length;
      try {
        const users = await api.get('/users/');
        $('#dash-users').textContent = users.filter(u => u.is_active).length;
      } catch { $('#dash-users').textContent = '—'; }
      if (orders.length) {
        html($('#dash-activity'), orders.slice(0, 10).map(o =>
          `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
            <span>Order #${o.id}</span>
            <span class="badge badge-${actionBadge(o.action)}">${o.action}</span>
            <span class="tabular-nums">${formatMoney(o.total_amount)}</span>
          </div>`
        ).join(''));
      } else {
        html($('#dash-activity'), '<div class="empty-state"><p>No recent orders</p></div>');
      }
    } catch (err) {
      html($('#dash-activity'), `<div class="error-message">${err.message}</div>`);
    }
  } else {
    html(el, `
      <div class="page-header"><h2>Dashboard</h2></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-label">Active Orders</div><div class="stat-value" id="dash-active">—</div></div>
        <div class="stat-card"><div class="stat-label">Available Tables</div><div class="stat-value" id="dash-tables">—</div></div>
        <div class="stat-card"><div class="stat-label">Today's Revenue</div><div class="stat-value tabular-nums" id="dash-revenue">—</div></div>
      </div>
      <div class="card"><div class="card-header">Recent Orders</div><div class="card-body" id="dash-recent"><div class="loading-center"><div class="spinner"></div></div></div></div>
    `);
    try {
      const bid = state.selectedBranch;
      const [orders, tables] = await Promise.all([
        bid ? api.get(`/orders/?branch_id=${bid}`) : Promise.resolve([]),
        bid ? api.get(`/tables/branch/${bid}`) : Promise.resolve([]),
      ]);
      const active = orders.filter(o => o.action === 'create' || o.action === 'update');
      const avail = tables.filter(t => t.is_available);
      const revenue = orders.filter(o => o.action === 'pay').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
      $('#dash-active').textContent = active.length;
      $('#dash-tables').textContent = `${avail.length} / ${tables.length}`;
      $('#dash-revenue').textContent = formatMoney(revenue);
      if (orders.length) {
        html($('#dash-recent'), orders.slice(0, 8).map(o =>
          `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
            <span>Order #${o.id}</span>
            <span class="badge badge-${actionBadge(o.action)}">${o.action}</span>
            <span class="tabular-nums">${formatMoney(o.total_amount)}</span>
          </div>`
        ).join(''));
      } else {
        html($('#dash-recent'), '<div class="empty-state"><p>No orders yet</p></div>');
      }
    } catch (err) {
      html($('#dash-recent'), `<div class="error-message">${err.message}</div>`);
    }
  }
}

function actionBadge(action) {
  const map = {
    create: 'info',
    update: 'warning',
    pay: 'success',
    cancel: 'danger'
  };
  return map[action] || 'gray';
}
function getItemTotal(item) {
  const extraSum = item.extras.reduce((sum, extra) => sum + (extra.price || 0), 0);
  return item.quantity * (item.price + extraSum);
}
// ── POS ─────────────────────────────────────────────────────
async function renderPOS(el) {
  html(el, `<div class="pos-layout">
    <div class="pos-categories" id="pos-cats"><div class="loading-center"><div class="spinner"></div></div></div>
    <div class="pos-products">
      <div class="pos-search"><input type="text" id="pos-search-input" placeholder="Search products…"></div>
      <div id="pos-product-grid" class="product-grid"><div class="loading-center"><div class="spinner"></div></div></div>
    </div>
    <div class="pos-cart">
      <div class="cart-header">Current Order</div>
      <div class="cart-table-info" id="cart-table-info">
        <span id="cart-table-label">No table selected</span>
        <button class="btn btn-sm btn-outline" id="cart-pick-table">Pick Table</button>
      </div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-summary" id="cart-summary"></div>
      <div class="cart-actions">
        <button class="btn btn-success btn-lg" id="cart-checkout-btn" disabled>Checkout</button>
        <div class="flex gap-sm">
          <button class="btn btn-outline btn-sm w-full" id="cart-hold-btn">Hold</button>
          <button class="btn btn-danger btn-sm w-full" id="cart-clear-btn">Clear</button>
        </div>
      </div>
    </div>
    <div class="pos-bottom">
      <span class="text-sm text-muted">Items: <strong id="pos-total-items">0</strong></span>
      <span class="text-sm text-muted">Subtotal: <strong class="tabular-nums" id="pos-subtotal">0.00</strong></span>
      <span class="text-sm font-bold">Total: <strong class="tabular-nums" id="pos-total">0.00</strong></span>
      <span class="mt-auto"></span>
      <button class="btn btn-sm btn-outline" id="pos-walkin-btn">Walk-in / Takeaway</button>
    </div>
  </div>`);

  const bid = state.selectedBranch;

  // Load data + FULL enrichment with extras
  try {
    const [cats, items] = await Promise.all([
      api.get('/categories/'),
      bid ? api.get(`/menu-items/branch/${bid}`) : api.get('/menu-items/'),
    ]);

    state.categories = cats;
    state.menuItems = items;

    // === CRITICAL FIX: Load extras list + full menu item details (with menu_items_extras) ===
    if (!state.extras?.length) {
      try {
        state.extras = await api.get('/extras/');
      } catch { state.extras = []; }
    }

    // Enrich every menu item with its extras (the list endpoint doesn't include them)
    for (const mi of state.menuItems) {
      try {
        const detail = await api.get(`/menu-items/${mi.id}`);
        mi.menu_items_extras = detail.menu_items_extras || [];
      } catch (e) {
        mi.menu_items_extras = [];
      }
    }

    await enrichMenuItems();           // product/size names
    renderPOSCategories(null);
    renderPOSProducts(state.menuItems);
  } catch (err) {
    html($('#pos-product-grid'), `<div class="error-message">${err.message}</div>`);
  }

  // Search
  $('#pos-search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = state.menuItems.filter(mi =>
      (mi._productName || '').toLowerCase().includes(q) ||
      (mi._sizeName || '').toLowerCase().includes(q)
    );
    renderPOSProducts(filtered);
  });

  // Table picker
  $('#cart-pick-table').addEventListener('click', showTablePicker);
  $('#pos-walkin-btn').addEventListener('click', () => {
    state.cartTable = null;
    $('#cart-table-label').textContent = 'Walk-in / Takeaway';
  });

  // Checkout / Hold / Clear
  $('#cart-checkout-btn').addEventListener('click', handleCheckout);
  $('#cart-hold-btn').addEventListener('click', handleHold);
  $('#cart-clear-btn').addEventListener('click', () => {
    state.cart = [];
    state.cartTable = null;
    renderCart();
    $('#cart-table-label').textContent = 'No table selected';
  });

  renderCart();
}
let _productCache = {};
let _sizeCache = {};

async function enrichMenuItems() {
  // Fetch products and sizes for name display
  try {
    if (!Object.keys(_productCache).length) {
      const prods = await api.get('/products/');
      prods.forEach(p => _productCache[p.id] = p.name);
    }
  } catch { }
  try {
    if (!Object.keys(_sizeCache).length) {
      const sizes = await api.get('/sizes/');
      sizes.forEach(s => _sizeCache[s.id] = s.name);
    }
  } catch { }
  state.menuItems.forEach(mi => {
    mi._productName = _productCache[mi.product_id] || `Product ${mi.product_id}`;
    mi._sizeName = _sizeCache[mi.size_id] || `Size ${mi.size_id}`;
  });
}

function renderPOSCategories(activeCatId) {
  const el = $('#pos-cats');
  let h = `<div class="cat-item ${activeCatId === null ? 'active' : ''}" data-cat="all">All Items</div>`;
  for (const c of state.categories) {
    h += `<div class="cat-item ${activeCatId === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</div>`;
  }
  html(el, h);
  el.querySelectorAll('.cat-item').forEach(ci => {
    ci.addEventListener('click', () => {
      const catId = ci.dataset.cat === 'all' ? null : parseInt(ci.dataset.cat);
      renderPOSCategories(catId);
      // Get category's product ids
      if (catId) {
        const prodIds = Object.entries(_productCache).length
          ? state.menuItems.filter(mi => {
            // We need category_id on product. Let's filter via product API data.
            return true; // We'll do a simpler filter
          })
          : state.menuItems;
        // Simple: filter by checking the product -> category mapping
        filterByCategory(catId);
      } else {
        renderPOSProducts(state.menuItems);
      }
    });
  });
}

async function filterByCategory(catId) {
  try {
    const prods = await api.get(`/categories/${catId}/products`);
    const prodIds = new Set(prods.map(p => p.id));
    const filtered = state.menuItems.filter(mi => prodIds.has(mi.product_id));
    renderPOSProducts(filtered);
  } catch {
    renderPOSProducts(state.menuItems);
  }
}

function renderPOSProducts(items) {
  const grid = $('#pos-product-grid');
  if (!items.length) {
    html(grid, '<div class="empty-state"><div class="empty-icon">🍽</div><p>No items found</p></div>');
    return;
  }
  html(grid, items.map(mi => `
    <div class="product-card" data-mi-id="${mi.id}">
      <div class="product-name">${mi._productName || 'Item'}</div>
      <div class="product-size">${mi._sizeName || ''}</div>
      <div class="product-price">${formatMoney(mi.price)}</div>
      ${mi.menu_items_extras && mi.menu_items_extras.length ? `<div class="product-extras">+${mi.menu_items_extras.length} extras</div>` : ''}
    </div>
  `).join(''));
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      addProductWithExtras(parseInt(card.dataset.miId));
    });
  });
}

// ── NEW: Add item with optional extras selector ─────────────────────
async function addProductWithExtras(menuItemId) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;

  const hasExtras = !!(mi.menu_items_extras && mi.menu_items_extras.length);

  if (!hasExtras) {
    addItemToCart(mi, []);
    return;
  }

  // Build extras checkboxes
  let extrasHtml = mi.menu_items_extras.map(ex => {
    const name = ex.name ||
      (state.extras && state.extras.find(e => e.id === (ex.extra_id || ex.id))
        ? state.extras.find(e => e.id === (ex.extra_id || ex.id)).name
        : `Extra #${ex.id}`);
    return `
      <label style="display:block;padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">
        <input type="checkbox" class="extra-check" 
               data-id="${ex.id}" 
               data-price="${ex.price}" 
               data-name="${name}">
        <span style="margin-left:8px;">${name}</span>
        <span class="text-sm text-muted" style="float:right;">+${formatMoney(ex.price)}</span>
      </label>`;
  }).join('');

  showModal(`Add ${mi._productName} — Select Extras`, `
    <div style="max-height:420px;overflow-y:auto;">
      ${extrasHtml}
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button id="confirm-extras-btn" class="btn btn-primary btn-block">Add Item + Extras</button>
      <button id="skip-extras-btn" class="btn btn-outline btn-block">Add Item (No Extras)</button>
    </div>
  `);

  // Listeners (modal is rendered synchronously)
  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-extras-btn');
    const skipBtn = document.getElementById('skip-extras-btn');

    confirmBtn.addEventListener('click', () => {
      const selected = [];
      document.querySelectorAll('#modal-container .extra-check:checked').forEach(chk => {
        selected.push({
          id: parseInt(chk.dataset.id),          // menu_item_extra_id
          name: chk.dataset.name,
          price: parseFloat(chk.dataset.price)
        });
      });
      closeModal();
      addItemToCart(mi, selected);
    });

    skipBtn.addEventListener('click', () => {
      closeModal();
      addItemToCart(mi, []);
    });
  }, 10);
}

// Helper: actually add to cart (used by both paths)
function addItemToCart(mi, selectedExtras) {
  // Check if identical item + same extras already exists
  const existing = state.cart.find(c =>
    c.menuItemId === mi.id &&
    JSON.stringify(c.extras.map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort())
  );

  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({
      menuItemId: mi.id,
      name: mi._productName,
      size: mi._sizeName,
      price: parseFloat(mi.price),
      quantity: 1,
      extras: selectedExtras
    });
  }

  renderCart();
  // toast(`✅ Added ${mi._productName}${selectedExtras.length ? ' + extras' : ''}`, 'success');
}
function renderCart() {
  const itemsEl = $('#cart-items');
  const summaryEl = $('#cart-summary');

  if (!state.cart.length) {
    html(itemsEl, '<div class="empty-state"><div class="empty-icon">🛒</div><p>Cart is empty</p></div>');
    html(summaryEl, '');
    $('#cart-checkout-btn').disabled = true;
    if ($('#pos-total-items')) $('#pos-total-items').textContent = '0';
    if ($('#pos-subtotal')) $('#pos-subtotal').textContent = '0.00';
    if ($('#pos-total')) $('#pos-total').textContent = '0.00';
    return;
  }

  html(itemsEl, state.cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-extras">${item.size}${item.extras.length ? ' · ' + item.extras.map(e => e.name).join(', ') : ''}</div>
      </div>
      <div class="cart-item-qty">
        <button data-action="dec" data-idx="${idx}">−</button>
        <span>${item.quantity}</span>
        <button data-action="inc" data-idx="${idx}">+</button>
      </div>
      <div class="cart-item-price">${formatMoney(getItemTotal(item))}</div>
    </div>
  `).join(''));

  itemsEl.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'inc') state.cart[idx].quantity++;
      else {
        state.cart[idx].quantity--;
        if (state.cart[idx].quantity <= 0) state.cart.splice(idx, 1);
      }
      renderCart();
    });
  });

  const subtotal = state.cart.reduce((s, i) => s + getItemTotal(i), 0);
  const tax = subtotal * 0.0; // Configurable later
  const total = subtotal + tax;
  const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);

  html(summaryEl, `
    <div class="cart-summary-row"><span>Subtotal</span><span class="tabular-nums">${formatMoney(subtotal)}</span></div>
    <div class="cart-summary-row"><span>Tax</span><span class="tabular-nums">${formatMoney(tax)}</span></div>
    <div class="cart-summary-row total"><span>Total</span><span class="tabular-nums">${formatMoney(total)}</span></div>
  `);

  $('#cart-checkout-btn').disabled = false;
  if ($('#pos-total-items')) $('#pos-total-items').textContent = totalItems;
  if ($('#pos-subtotal')) $('#pos-subtotal').textContent = formatMoney(subtotal);
  if ($('#pos-total')) $('#pos-total').textContent = formatMoney(total);
}
async function showTablePicker() {
  const bid = state.selectedBranch;
  if (!bid) { toast('Select a branch first', 'warning'); return; }
  try {
    const tables = await api.get(`/tables/branch/${bid}/available`);
    showModal('Select Table', `
      <div class="table-grid">
        ${tables.map(t => `
          <div class="table-card available" data-tid="${t.id}">
            <div class="table-number">T${t.id}</div>
            <div class="table-chairs">${t.num_chairs} chairs</div>
          </div>
        `).join('')}
        ${!tables.length ? '<div class="empty-state"><p>No available tables</p></div>' : ''}
      </div>
    `);
    $$('#modal-container .table-card').forEach(card => {
      card.addEventListener('click', () => {
        state.cartTable = parseInt(card.dataset.tid);
        $('#cart-table-label').textContent = `Table T${state.cartTable}`;
        closeModal();
        toast('Table selected', 'success');
      });
    });
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handleCheckout() {
  if (!state.cart.length) return;
  const bid = state.selectedBranch;
  if (!bid) { toast('Select a branch first', 'warning'); return; }

  const totalWithExtras = state.cart.reduce((s, i) => s + getItemTotal(i), 0);

  // Show payment method dialog
  showModal('Checkout', `
    <div class="form-group">
      <label>Payment Method</label>
      <select id="checkout-payment">
        <option value="cash">Cash</option>
        <option value="card">Card</option>
      </select>
    </div>

    <!-- FIXED: Now shows correct total including extras -->
    <div class="cart-summary-row total" style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;">
      <span>Total</span>
      <span class="tabular-nums">${formatMoney(totalWithExtras)}</span>
    </div>

    <div style="margin-top:20px;display:flex;gap:8px;">
      <button class="btn btn-success btn-lg w-full" id="confirm-checkout">Confirm & Pay</button>
      <button class="btn btn-outline" id="cancel-checkout">Cancel</button>
    </div>
  `);

  $('#cancel-checkout').addEventListener('click', closeModal);
  $('#confirm-checkout').addEventListener('click', async () => {
    const payment = $('#checkout-payment').value;
    try {
      // 1. Create order (already correct)
      const orderData = {
        cashier_id: state.user.id,
        branch_id: bid,
        table_id: state.cartTable,
        total_amount: state.cart.reduce((s, i) => s + getItemTotal(i), 0),
        action: "create",
        payment_method: null,
        items: state.cart.map(c => ({
          menu_item_id: c.menuItemId,
          quantity: c.quantity,
          price_at_time: c.price,
          extras: c.extras.map(e => ({
            menu_item_extra_id: e.id,
            quantity: 1,
            price_at_time: e.price,
          })),
        })),
      };
      const order = await api.post('/orders/', orderData);

      // 2. Checkout
      await api.post(`/orders/${order.id}/checkout`, { payment_method: payment });

      state.cart = [];
      state.cartTable = null;
      closeModal();
      toast('Order completed successfully!', 'success');
      renderPOS($('#content'));
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}
async function handleHold() {
  if (!state.cart.length) return;

  const bid = state.selectedBranch;
  if (!bid) {
    toast('Select a branch first', 'warning');
    return;
  }

  try {
    const orderData = {
      cashier_id: state.user.id,
      branch_id: bid,
      table_id: state.cartTable,
      total_amount: state.cart.reduce((s, i) => s + getItemTotal(i), 0),
      action: "create",           // ← REQUIRED
      payment_method: null,       // ← not paid yet
      items: state.cart.map(c => ({
        menu_item_id: c.menuItemId,
        quantity: c.quantity,
        price_at_time: c.price,
        extras: c.extras.map(e => ({
          menu_item_extra_id: e.id,
          quantity: 1,
          price_at_time: e.price,
        })),
      })),
    };

    const order = await api.post('/orders/', orderData);

    // Clear cart
    state.cart = [];
    state.cartTable = null;

    toast(`Order #${order.id} held successfully!`, 'success');

    // Refresh POS UI
    renderPOS($('#content'));
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Active Orders ───────────────────────────────────────────

// ── Checkout held order with payment selector ─────────────────────
async function handleHeldCheckout(orderId) {
  showModal(`Checkout Order #${orderId}`, `
    <div class="form-group">
      <label>Payment Method</label>
      <select id="held-checkout-payment">
        <option value="cash">Cash</option>
        <option value="card">Card</option>
      </select>
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button class="btn btn-success btn-lg w-full" id="confirm-held-checkout">Confirm & Pay</button>
      <button class="btn btn-outline" id="cancel-held-checkout">Cancel</button>
    </div>
  `);

  $('#cancel-held-checkout').addEventListener('click', closeModal);
  $('#confirm-held-checkout').addEventListener('click', async () => {
    const payment = $('#held-checkout-payment').value;
    try {
      await api.post(`/orders/${orderId}/checkout`, { payment_method: payment });
      closeModal();
      toast('Order checked out successfully!', 'success');
      if (state.currentRoute === 'orders') renderOrders($('#content'));
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

// ── NEW/UPDATED: Full extras support for held orders ─────────────────────
async function addItemToHeldOrderWithExtras(orderId, menuItemId) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;

  const hasExtras = !!(mi.menu_items_extras && mi.menu_items_extras.length);

  if (!hasExtras) {
    await addItemToHeldOrder(orderId, menuItemId, []);
    return;
  }

  // Same beautiful modal as POS
  let extrasHtml = mi.menu_items_extras.map(ex => {
    const name = ex.name ||
      (state.extras && state.extras.find(e => e.id === (ex.extra_id || ex.id))
        ? state.extras.find(e => e.id === (ex.extra_id || ex.id)).name
        : `Extra #${ex.id}`);
    return `
      <label style="display:block;padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">
        <input type="checkbox" class="extra-check" 
               data-id="${ex.id}" 
               data-price="${ex.price}" 
               data-name="${name}">
        <span style="margin-left:8px;">${name}</span>
        <span class="text-sm text-muted" style="float:right;">+${formatMoney(ex.price)}</span>
      </label>`;
  }).join('');

  showModal(`Add ${mi._productName} to Order #${orderId} — Select Extras`, `
    <div style="max-height:420px;overflow-y:auto;">
      ${extrasHtml}
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button id="confirm-extras-held-btn" class="btn btn-primary btn-block">Add Item + Extras</button>
      <button id="skip-extras-held-btn" class="btn btn-outline btn-block">Add Item (No Extras)</button>
    </div>
  `);

  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-extras-held-btn');
    const skipBtn = document.getElementById('skip-extras-held-btn');

    confirmBtn.addEventListener('click', () => {
      const selected = [];
      document.querySelectorAll('#modal-container .extra-check:checked').forEach(chk => {
        selected.push({
          id: parseInt(chk.dataset.id),
          name: chk.dataset.name,
          price: parseFloat(chk.dataset.price)
        });
      });
      closeModal();
      addItemToHeldOrder(orderId, menuItemId, selected);
    });

    skipBtn.addEventListener('click', () => {
      closeModal();
      addItemToHeldOrder(orderId, menuItemId, []);
    });
  }, 10);
}

// ── UPDATED: Add items modal (now shows extras count) ─────────────────────
async function showAddItemsToOrder(orderId) {
  const bid = state.selectedBranch;
  if (!bid) return toast('Select a branch first', 'warning');

  try {
    // Load menu items + FULL enrichment (names + extras)
    if (!state.menuItems?.length || !state.menuItems[0].menu_items_extras) {
      state.menuItems = await api.get(`/menu-items/branch/${bid}`);
      await enrichMenuItems();                    // product/size names

      // CRITICAL: Load extras for each menu item (same as POS)
      for (const mi of state.menuItems) {
        try {
          const detail = await api.get(`/menu-items/${mi.id}`);
          mi.menu_items_extras = detail.menu_items_extras || [];
        } catch (e) {
          mi.menu_items_extras = [];
        }
      }
    }

    showModal(`Add Items to Order #${orderId}`, `
      <div style="max-height:420px;overflow-y:auto;">
        <div class="pos-search" style="margin-bottom:12px;">
          <input type="text" id="add-search-input" placeholder="Search products to add..." style="width:100%;">
        </div>
        <div id="add-product-grid" class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));"></div>
      </div>
    `);

    const grid = document.getElementById('add-product-grid');
    const searchInput = document.getElementById('add-search-input');

    function renderGrid(items) {
      if (!items.length) {
        grid.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
        return;
      }
      grid.innerHTML = items.map(mi => `
        <div class="product-card" data-mi-id="${mi.id}">
          <div class="product-name">${mi._productName || 'Item'}</div>
          <div class="product-size">${mi._sizeName || ''}</div>
          <div class="product-price">${formatMoney(mi.price)}</div>
          ${mi.menu_items_extras && mi.menu_items_extras.length ?
          `<div class="product-extras">+${mi.menu_items_extras.length} extras</div>` : ''}
        </div>
      `).join('');

      grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
          const miId = parseInt(card.dataset.miId);
          addItemToHeldOrderWithExtras(orderId, miId);
        });
      });
    }

    renderGrid(state.menuItems);

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = state.menuItems.filter(mi =>
        (mi._productName || '').toLowerCase().includes(q) ||
        (mi._sizeName || '').toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── UPDATED: Backend call now supports extras ─────────────────────
async function addItemToHeldOrder(orderId, menuItemId, selectedExtras = []) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;

  const addData = {
    items: [{
      menu_item_id: menuItemId,
      quantity: 1,
      price_at_time: parseFloat(mi.price),
      extras: selectedExtras.map(e => ({
        menu_item_extra_id: e.id,
        quantity: 1,
        price_at_time: e.price,
      })),
    }]
  };

  try {
    await api.post(`/orders/${orderId}/items`, addData);
    // toast(`✅ Added ${mi._productName}${selectedExtras.length ? ' + extras' : ''} to order #${orderId}`, 'success');
    if (state.currentRoute === 'orders') renderOrders($('#content'));
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Active Orders ───────────────────────────────────────────
async function renderOrders(el) {
  html(el, `
    <div class="page-header"><h2>Active Orders</h2><button class="btn btn-primary" id="refresh-orders">Refresh</button></div>
    <div id="orders-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  const bid = state.selectedBranch;
  if (!bid) {
    html($('#orders-list'), '<div class="empty-state"><p>Select a branch</p></div>');
    return;
  }

  try {
    const orders = await api.get(`/orders/?branch_id=${bid}`);
    state.orders = orders;
    const active = orders.filter(o => o.action === 'create' || o.action === 'update');

    if (!active.length) {
      html($('#orders-list'), '<div class="empty-state"><div class="empty-icon">📋</div><p>No active orders</p></div>');
      return;
    }

    html($('#orders-list'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr>
            <th>Order #</th><th>Table</th><th>Status</th><th>Payment</th><th>Total</th><th>Created</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${active.map(o => `<tr>
              <td><strong>#${o.id}</strong></td>
              <td>${o.table_id ? 'T' + o.table_id : 'Walk-in'}</td>
              <td><span class="badge badge-${actionBadge(o.action)}">${o.action}</span></td>
              <td>${o.payment_method || '—'}</td>
              <td class="tabular-nums font-bold">${formatMoney(o.total_amount)}</td>
              <td class="text-sm text-muted">${formatDate(o.created_at)}</td>
              <td>
                <button class="btn btn-sm btn-outline" data-view-order="${o.id}">View</button>
                <button class="btn btn-sm btn-primary" data-add-items="${o.id}">+ Add</button>
                <button class="btn btn-sm btn-success" data-checkout-order="${o.id}">Checkout</button>
                <button class="btn btn-sm btn-danger" data-cancel-order="${o.id}">Cancel</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);

    // View
    el.querySelectorAll('[data-view-order]').forEach(btn => {
      btn.addEventListener('click', () => showOrderDetail(parseInt(btn.dataset.viewOrder)));
    });

    // NEW: Add items to held order
    el.querySelectorAll('[data-add-items]').forEach(btn => {
      btn.addEventListener('click', () => showAddItemsToOrder(parseInt(btn.dataset.addItems)));
    });

    // NEW: Checkout with payment method selector
    el.querySelectorAll('[data-checkout-order]').forEach(btn => {
      btn.addEventListener('click', () => handleHeldCheckout(parseInt(btn.dataset.checkoutOrder)));
    });

    // Cancel
    el.querySelectorAll('[data-cancel-order]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const confirmed = await confirmAction(
          'Cancel Order',
          `Cancel Order #${btn.dataset.cancelOrder}? This cannot be undone.`,
          { danger: true }
        );
        if (!confirmed) return;

        try {
          await api.post(`/orders/${btn.dataset.cancelOrder}/cancel`, {});
          // toast('Order cancelled', 'warning');
          renderOrders(el);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    html($('#orders-list'), `<div class="error-message">${err.message}</div>`);
  }

  $('#refresh-orders').addEventListener('click', () => renderOrders(el));
}
// ── UPDATED showOrderDetail (added Excel download button inside the drawer) ──
async function showOrderDetail(orderId) {
  try {
    const order = await api.get(`/orders/${orderId}`);
    const historyData = await api.get(`/history/orders/${orderId}`).catch(() => []);

    openDrawer(`Order #${orderId}`, `
      <div class="flex justify-between items-center mb-4">
        <h3 class="mb-0">Order #${orderId}</h3>
        ${isAdmin() ? `
        <button id="drawer-export-excel" class="btn btn-success">
          📥 Download Detailed History (Excel)
        </button>` : ''}
      </div>

      <div class="tabs" id="order-tabs">
        <div class="tab-item active" data-tab="summary">Summary</div>
        <div class="tab-item" data-tab="items">Items</div>
        <div class="tab-item" data-tab="timeline">History</div>
      </div>

      <!-- rest of your existing tab content (unchanged) -->
      <div class="tab-content active" id="tab-summary"> ... </div>
      <div class="tab-content" id="tab-items"> ... </div>
      <div class="tab-content" id="tab-timeline"> ... </div>
    `);

    setupTabs('order-tabs');

    // NEW: Excel download from inside the drawer
    const exportBtn = $('#drawer-export-excel');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        api.downloadExcel(
          `/history/orders/${orderId}/export-excel`,
          `order_${orderId}_detailed_history.xlsx`
        );
      });
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}
// ── Tables ──────────────────────────────────────────────────
async function renderTables(el) {
  html(el, `
    <div class="page-header"><h2>Tables</h2>${isAdmin() ? '<button class="btn btn-primary" id="add-table-btn">Add Table</button>' : ''}</div>
    <div id="tables-grid"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  const bid = state.selectedBranch;
  if (!bid) { html($('#tables-grid'), '<div class="empty-state"><p>Select a branch</p></div>'); return; }

  try {
    const tables = await api.get(`/tables/branch/${bid}`);
    state.tables = tables;
    if (!tables.length) {
      html($('#tables-grid'), '<div class="empty-state"><div class="empty-icon">🪑</div><p>No tables configured</p></div>');
    } else {
      html($('#tables-grid'), `<div class="table-grid">${tables.map(t => `
        <div class="table-card ${t.is_available ? 'available' : 'occupied'}" data-table-id="${t.id}">
          <div class="table-number">T${t.id}</div>
          <div class="table-chairs">${t.num_chairs} chairs</div>
          <span class="badge ${t.is_available ? 'badge-success' : 'badge-danger'}">${t.is_available ? 'Available' : 'Occupied'}</span>
        </div>
      `).join('')}</div>`);

      el.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', () => showTableActions(parseInt(card.dataset.tableId)));
      });
    }
  } catch (err) {
    html($('#tables-grid'), `<div class="error-message">${err.message}</div>`);
  }

  if (isAdmin() && $('#add-table-btn')) {
    $('#add-table-btn').addEventListener('click', () => showTableForm());
  }
}

function showTableActions(tableId) {
  const t = state.tables.find(x => x.id === tableId);
  if (!t) return;
  showModal(`Table T${tableId}`, `
    <div style="text-align:center;margin-bottom:16px;">
      <div class="table-number" style="font-size:2rem;">${t.num_chairs} chairs</div>
      <span class="badge ${t.is_available ? 'badge-success' : 'badge-danger'}">${t.is_available ? 'Available' : 'Occupied'}</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn btn-primary" id="table-toggle-avail">${t.is_available ? 'Mark Occupied' : 'Mark Available'}</button>
      ${isAdmin() ? `<button class="btn btn-danger" id="table-delete">Delete Table</button>` : ''}
    </div>
  `);
  $('#table-toggle-avail').addEventListener('click', async () => {
    try {
      await api.patch(`/tables/${tableId}`, { is_available: !t.is_available });
      closeModal();
      toast('Table updated', 'success');
      renderTables($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
  if ($('#table-delete')) {
    $('#table-delete').addEventListener('click', async () => {
      const confirmed = await confirmAction(
        'Delete Table',
        `Delete Table T${tableId}? This action is permanent.`,
        { danger: true }
      );
      if (!confirmed) return;

      try {
        await api.del(`/tables/${tableId}`);
        closeModal();
        toast('Table deleted', 'success');
        renderTables($('#content'));
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }
}


function showTableForm() {
  openDrawer('Add Table', `
    <form id="table-form">
      <div class="form-group">
        <label>Branch</label>
        <select id="tf-branch" disabled><option value="${state.selectedBranch}">Current Branch</option></select>
      </div>
      <div class="form-group">
        <label>Number of Chairs</label>
        <input type="number" id="tf-chairs" min="1" value="4" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block">Create Table</button>
    </form>
  `);
  $('#table-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables/', {
        branch_id: state.selectedBranch,
        num_chairs: parseInt($('#tf-chairs').value),
      });
      closeDrawer();
      toast('Table created', 'success');
      renderTables($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── UPDATED renderHistory (added branch export button + per-order Excel button) ──
async function renderHistory(el) {
  html(el, `
    <div class="page-header">
      <h2>Order History</h2>
      <div class="flex gap-3">
        <button class="btn btn-primary" id="refresh-history">Refresh</button>
        
        <!-- NEW: Branch-level export (admin only) -->
        ${isAdmin() ? `
          <button id="export-branch-history" class="btn btn-success">
            📥 Download Full Branch History (Excel)
          </button>` : ''}
      </div>
    </div>
    <div id="history-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  const bid = state.selectedBranch;
  if (!bid) {
    html($('#history-list'), '<div class="empty-state"><p>Select a branch</p></div>');
    return;
  }

  try {
    const orders = await api.get(`/orders/?branch_id=${bid}&limit=100`);
    state.completedOrders = orders.filter(o => o.action === 'pay' || o.action === 'cancel');
    state.historyPage = 1;
    renderHistoryTable(el);
  } catch (err) {
    html($('#history-list'), `<div class="error-message">${err.message}</div>`);
  }

  // Refresh
  $('#refresh-history').addEventListener('click', () => renderHistory(el));

  // NEW: Branch export
  const branchBtn = $('#export-branch-history');
  if (branchBtn) {
    branchBtn.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        'Download Full Branch History',
        `This will export detailed history of ALL orders in branch #${bid} as an Excel file (3 sheets).`,
        { confirmText: 'Download', danger: false }
      );
      if (!confirmed) return;

      await api.downloadExcel(
        `/history/branches/${bid}/export-excel`,
        `branch_${bid}_detailed_history.xlsx`
      );
    });
  }
}
// ── UPDATED renderHistoryTable (added per-order Excel button) ──
function renderHistoryTable(el) {
  const listEl = $('#history-list');
  const pageSize = state.historyPageSize;
  const page = state.historyPage;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const paginated = state.completedOrders.slice(start, end);
  const totalPages = Math.ceil(state.completedOrders.length / pageSize) || 1;

  if (!state.completedOrders.length) {
    html(listEl, '<div class="empty-state"><div class="empty-icon">📜</div><p>No completed orders</p></div>');
    return;
  }

  let htmlContent = `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${paginated.map(o => `
            <tr>
              <td><strong>#${o.id}</strong></td>
              <td><span class="badge badge-${actionBadge(o.action)}">${o.action}</span></td>
              <td>${o.payment_method || '—'}</td>
              <td class="tabular-nums font-bold">${formatMoney(o.total_amount)}</td>
              <td class="text-sm text-muted">${formatDate(o.created_at)}</td>
              <td>
                <button class="btn btn-sm btn-outline" data-view-order="${o.id}">View</button>
                ${isAdmin() ? `
                <button class="btn btn-sm btn-success" data-export-order="${o.id}" title="Download detailed Excel">
                  📥 Excel
                </button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Pagination (unchanged) -->
    <div class="pagination-controls" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <div class="text-sm text-muted">
        Showing <strong>${start + 1}–${Math.min(end, state.completedOrders.length)}</strong> 
        of <strong>${state.completedOrders.length}</strong> completed orders
      </div>
      <div style="display:flex;gap:12px;align-items:center;">
        <button id="history-prev" class="btn btn-sm btn-outline" ${page === 1 ? 'disabled' : ''}>← Previous</button>
        <span class="text-sm">Page <strong>${page}</strong> of ${totalPages}</span>
        <button id="history-next" class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled' : ''}>Next →</button>

        <select id="history-page-size" class="btn btn-sm btn-outline" style="padding:4px 8px;">
          <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
          <option value="20" ${pageSize === 20 ? 'selected' : ''}>20</option>
          <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
        </select>
      </div>
    </div>
  `;

  html(listEl, htmlContent);

  // Existing pagination listeners...
  $('#history-prev')?.addEventListener('click', () => { if (state.historyPage > 1) { state.historyPage--; renderHistoryTable(el); } });
  $('#history-next')?.addEventListener('click', () => { if (state.historyPage < totalPages) { state.historyPage++; renderHistoryTable(el); } });
  $('#history-page-size')?.addEventListener('change', (e) => {
    state.historyPageSize = parseInt(e.target.value);
    state.historyPage = 1;
    renderHistoryTable(el);
  });

  // View buttons
  listEl.querySelectorAll('[data-view-order]').forEach(btn => {
    btn.addEventListener('click', () => showOrderDetail(parseInt(btn.dataset.viewOrder)));
  });

  // NEW: Per-order Excel export
  listEl.querySelectorAll('[data-export-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = parseInt(btn.dataset.exportOrder);
      api.downloadExcel(
        `/history/orders/${orderId}/export-excel`,
        `order_${orderId}_detailed_history.xlsx`
      );
    });
  });
}
// ── Profile ─────────────────────────────────────────────────
function renderProfile(el) {
  const u = state.user;
  html(el, `
    <div class="page-header"><h2>Profile</h2></div>
    <div class="card" style="max-width:480px;">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div class="user-avatar" style="width:56px;height:56px;font-size:1.4rem;">${(u.username || '?')[0].toUpperCase()}</div>
          <div>
            <div class="font-bold text-lg">${u.username}</div>
            <div class="badge badge-info">${u.role}</div>
          </div>
        </div>
        <div style="font-size:0.85rem;display:grid;gap:8px;">
          <div><span class="text-muted">User ID:</span> ${u.id}</div>
          <div><span class="text-muted">Branch ID:</span> ${u.branch_id}</div>
          <div><span class="text-muted">Status:</span> <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></div>
        </div>
        <hr style="margin:20px 0;border:none;border-top:1px solid var(--border);">
        <h4 style="margin-bottom:12px;">Reset Password</h4>
        <form id="reset-pw-form">
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="new-pw" required minlength="4">
          </div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  `);
  $('#reset-pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { new_password: $('#new-pw').value });
      toast('Password updated', 'success');
      $('#new-pw').value = '';
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Branches ─────────────────────────────────────────
async function renderBranches(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Branches</h2><button class="btn btn-primary" id="add-branch-btn">Add Branch</button></div>
    <div id="branches-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const branches = await api.get('/branches/');
    state.branches = branches;
    if (!branches.length) {
      html($('#branches-list'), '<div class="empty-state"><div class="empty-icon">🏢</div><p>No branches</p></div>');
    } else {
      html($('#branches-list'), `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              ${branches.map(b => `<tr>
                <td>${b.id}</td>
                <td><strong>${b.name}</strong></td>
                <td class="text-sm text-muted">${formatDate(b.created_at)}</td>
                <td>
                  <button class="btn btn-sm btn-outline" data-edit-branch="${b.id}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-del-branch="${b.id}">Delete</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `);
      el.querySelectorAll('[data-edit-branch]').forEach(btn => {
        btn.addEventListener('click', () => showBranchForm(parseInt(btn.dataset.editBranch)));
      });
      el.querySelectorAll('[data-del-branch]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const confirmed = await confirmAction('Delete Branch', `Delete branch #${btn.dataset.delBranch}?`, { danger: true });
          if (!confirmed) return;
          try {
            await api.del(`/branches/${btn.dataset.delBranch}`);
            toast('Branch deleted', 'success');
            renderBranches(el);
          } catch (err) { toast(err.message, 'error'); }
        });
      });
    }
  } catch (err) {
    html($('#branches-list'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-branch-btn').addEventListener('click', () => showBranchForm());
}

function showBranchForm(branchId = null) {
  const isEdit = !!branchId;
  const branch = isEdit ? state.branches.find(b => b.id === branchId) : null;
  openDrawer(isEdit ? 'Edit Branch' : 'Add Branch', `
    <form id="branch-form">
      <div class="form-group">
        <label>Branch Name</label>
        <input type="text" id="bf-name" value="${branch ? branch.name : ''}" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#branch-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { name: $('#bf-name').value.trim() };
    try {
      if (isEdit) await api.put(`/branches/${branchId}`, data);
      else await api.post('/branches/', data);
      closeDrawer();
      toast(`Branch ${isEdit ? 'updated' : 'created'}`, 'success');
      renderBranches($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Users ────────────────────────────────────────────
async function renderUsers(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Users</h2><button class="btn btn-primary" id="add-user-btn">Add User</button></div>
    <div id="users-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const users = await api.get('/users/');
    state.users = users;
    html($('#users-list'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Username</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td><strong>${u.username}</strong></td>
              <td><span class="badge badge-info">${u.role}</span></td>
              <td>${u.branch_id}</td>
              <td><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td><button class="btn btn-sm btn-outline" data-edit-user="${u.id}">Edit</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);
    el.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', () => showUserForm(parseInt(btn.dataset.editUser)));
    });
  } catch (err) {
    html($('#users-list'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-user-btn').addEventListener('click', () => showUserForm());
}

function showUserForm(userId = null) {
  const isEdit = !!userId;
  const user = isEdit ? state.users.find(u => u.id === userId) : null;
  openDrawer(isEdit ? 'Edit User' : 'Add User', `
    <form id="user-form">
      <div class="form-group">
        <label>Branch</label>
        <select id="uf-branch" required>
          ${state.branches.map(b => `<option value="${b.id}" ${user && user.branch_id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="uf-username" value="${user ? user.username : ''}" required>
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="uf-role">
          <option value="cashier" ${user && user.role === 'cashier' ? 'selected' : ''}>Cashier</option>
          <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
      ${!isEdit ? `<div class="form-group"><label>Password</label><input type="password" id="uf-password" required></div>` : ''}
      ${isEdit ? `
        <div class="form-group">
          <label>Active</label>
          <select id="uf-active">
            <option value="true" ${user && user.is_active ? 'selected' : ''}>Active</option>
            <option value="false" ${user && !user.is_active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      ` : ''}
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.patch(`/users/${userId}`, {
          branch_id: parseInt($('#uf-branch').value),
          username: $('#uf-username').value.trim(),
          role: $('#uf-role').value,
          is_active: $('#uf-active').value === 'true',
        });
      } else {
        await api.post('/users/', {
          branch_id: parseInt($('#uf-branch').value),
          username: $('#uf-username').value.trim(),
          role: $('#uf-role').value,
          password: $('#uf-password').value,
        });
      }
      closeDrawer();
      toast(`User ${isEdit ? 'updated' : 'created'}`, 'success');
      renderUsers($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Categories ───────────────────────────────────────
async function renderCategories(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Categories</h2><button class="btn btn-primary" id="add-cat-btn">Add Category</button></div>
    <div id="cat-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const cats = await api.get('/categories/');
    state.categories = cats;
    html($('#cat-list'), crudTable(cats, ['id', 'name', 'created_at'], 'cat'));
    bindCrudActions(el, 'cat', renderCategories, showCategoryForm, '/categories');
  } catch (err) {
    html($('#cat-list'), `<div class="error-message">${err.message}</div>`);
  }
  $('#add-cat-btn').addEventListener('click', () => showCategoryForm());
}

function showCategoryForm(id = null) {
  const item = id ? state.categories.find(c => c.id === id) : null;
  openDrawer(id ? 'Edit Category' : 'Add Category', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/categories/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/categories/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Category ${id ? 'updated' : 'created'}`, 'success');
      renderCategories($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Products ─────────────────────────────────────────
async function renderProducts(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Products</h2><button class="btn btn-primary" id="add-prod-btn">Add Product</button></div>
    <div id="prod-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const [prods, cats] = await Promise.all([
      api.get('/products/'),
      api.get('/categories/'),
    ]);
    state.products = prods;
    state.categories = cats;
    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);
    html($('#prod-list'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>${prods.map(p => `<tr>
            <td>${p.id}</td>
            <td><strong>${p.name}</strong></td>
            <td>${catMap[p.category_id] || p.category_id}</td>
            <td>
              <button class="btn btn-sm btn-outline" data-edit-prod="${p.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del-prod="${p.id}">Delete</button>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `);
    el.querySelectorAll('[data-edit-prod]').forEach(b => b.addEventListener('click', () => showProductForm(parseInt(b.dataset.editProd))));
    el.querySelectorAll('[data-del-prod]').forEach(b => {
      b.addEventListener('click', async () => {
        const confirmed = await confirmAction(
          'Delete Product',
          `Delete product #${b.dataset.delProd}?`,
          { danger: true }
        );
        if (!confirmed) return;

        try {
          await api.del(`/products/${b.dataset.delProd}`);
          toast('Product deleted', 'success');
          renderProducts(el);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    html($('#prod-list'), `<div class="error-message">${err.message}</div>`);
  }
  $('#add-prod-btn').addEventListener('click', () => showProductForm());
}

function showProductForm(id = null) {
  const item = id ? state.products.find(p => p.id === id) : null;
  openDrawer(id ? 'Edit Product' : 'Add Product', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <div class="form-group">
        <label>Category</label>
        <select id="ef-cat" required>
          ${state.categories.map(c => `<option value="${c.id}" ${item && item.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { name: $('#ef-name').value.trim(), category_id: parseInt($('#ef-cat').value) };
    try {
      if (id) await api.put(`/products/${id}`, data);
      else await api.post('/products/', data);
      closeDrawer();
      toast(`Product ${id ? 'updated' : 'created'}`, 'success');
      renderProducts($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Sizes ────────────────────────────────────────────
async function renderSizes(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Sizes</h2><button class="btn btn-primary" id="add-size-btn">Add Size</button></div>
    <div id="size-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const sizes = await api.get('/sizes/');
    state.sizes = sizes;
    html($('#size-list'), crudTable(sizes, ['id', 'name'], 'size'));
    bindCrudActions(el, 'size', renderSizes, showSizeForm, '/sizes');
  } catch (err) {
    html($('#size-list'), `<div class="error-message">${err.message}</div>`);
  }
  $('#add-size-btn').addEventListener('click', () => showSizeForm());
}

function showSizeForm(id = null) {
  const item = id ? state.sizes.find(s => s.id === id) : null;
  openDrawer(id ? 'Edit Size' : 'Add Size', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/sizes/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/sizes/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Size ${id ? 'updated' : 'created'}`, 'success');
      renderSizes($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Extras ───────────────────────────────────────────
async function renderExtras(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Extras</h2><button class="btn btn-primary" id="add-extra-btn">Add Extra</button></div>
    <div id="extra-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const extras = await api.get('/extras/');
    state.extras = extras;
    html($('#extra-list'), crudTable(extras, ['id', 'name'], 'extra'));
    bindCrudActions(el, 'extra', renderExtras, showExtraForm, '/extras');
  } catch (err) {
    html($('#extra-list'), `<div class="error-message">${err.message}</div>`);
  }
  $('#add-extra-btn').addEventListener('click', () => showExtraForm());
}

function showExtraForm(id = null) {
  const item = id ? state.extras.find(e => e.id === id) : null;
  openDrawer(id ? 'Edit Extra' : 'Add Extra', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/extras/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/extras/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Extra ${id ? 'updated' : 'created'}`, 'success');
      renderExtras($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Admin: Menu Items ───────────────────────────────────────
async function renderMenuItems(el) {
  if (!isAdmin()) { html(el, '<div class="empty-state"><p>Access denied</p></div>'); return; }
  html(el, `
    <div class="page-header"><h2>Menu Items</h2><button class="btn btn-primary" id="add-mi-btn">Add Menu Item</button></div>
    <div id="mi-list"><div class="loading-center"><div class="spinner"></div></div></div>
  `);
  try {
    const [items, prods, sizes, branches, extras] = await Promise.all([
      api.get('/menu-items/'),
      api.get('/products/'),
      api.get('/sizes/'),
      api.get('/branches/'),
      api.get('/extras/'),
    ]);
    state.menuItems = items;
    state.products = prods;
    state.sizes = sizes;
    state.branches = branches;
    state.extras = extras;
    const pMap = {}; prods.forEach(p => pMap[p.id] = p.name);
    const sMap = {}; sizes.forEach(s => sMap[s.id] = s.name);
    const bMap = {}; branches.forEach(b => bMap[b.id] = b.name);

    html($('#mi-list'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Branch</th><th>Product</th><th>Size</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>${items.map(mi => `<tr>
            <td>${mi.id}</td>
            <td>${bMap[mi.branch_id] || mi.branch_id}</td>
            <td><strong>${pMap[mi.product_id] || mi.product_id}</strong></td>
            <td>${sMap[mi.size_id] || mi.size_id}</td>
            <td class="tabular-nums font-bold">${formatMoney(mi.price)}</td>
            <td>
              <button class="btn btn-sm btn-outline" data-edit-mi="${mi.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del-mi="${mi.id}">Delete</button>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `);
    el.querySelectorAll('[data-edit-mi]').forEach(b => b.addEventListener('click', () => showMenuItemForm(parseInt(b.dataset.editMi))));
    el.querySelectorAll('[data-del-mi]').forEach(b => {
      b.addEventListener('click', async () => {
        const confirmed = await confirmAction(
          'Delete Menu Item',
          `Delete menu item #${b.dataset.delMi}?`,
          { danger: true }
        );
        if (!confirmed) return;

        try {
          await api.del(`/menu-items/${b.dataset.delMi}`);
          toast('Menu item deleted', 'success');
          renderMenuItems(el);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    html($('#mi-list'), `<div class="error-message">${err.message}</div>`);
  }
  $('#add-mi-btn').addEventListener('click', () => showMenuItemForm());
}

function showMenuItemForm(id = null) {
  const isEdit = !!id;
  const item = isEdit ? state.menuItems.find(m => m.id === id) : null;

  openDrawer(isEdit ? 'Edit Menu Item' : 'New Menu Item', `
    <form id="mi-form">
      <div class="form-group">
        <label>Branch</label>
        <select id="mi-branch" required>
          ${state.branches.map(b => `<option value="${b.id}" ${item && item.branch_id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Product</label>
        <select id="mi-product" required>
          ${state.products.map(p => `<option value="${p.id}" ${item && item.product_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Size</label>
        <select id="mi-size" required>
          ${state.sizes.map(s => `<option value="${s.id}" ${item && item.size_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Price</label>
        <input type="number" id="mi-price" step="0.01" min="0" value="${item ? item.price : ''}" required>
      </div>
      <div class="form-group">
        <label>Extras</label>
        <div id="mi-extras-list">
          ${state.extras.map(ex => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <input type="checkbox" id="mix-${ex.id}" data-extra-id="${ex.id}" ${item && item.menu_items_extras && item.menu_items_extras.find(e => e.extra_id === ex.id) ? 'checked' : ''}>
              <label for="mix-${ex.id}" style="flex:1;margin:0;">${ex.name}</label>
              <input type="number" step="0.01" min="0" placeholder="Price" style="width:80px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:0.8rem;"
                data-extra-price="${ex.id}" value="${item && item.menu_items_extras && item.menu_items_extras.find(e => e.extra_id === ex.id) ? item.menu_items_extras.find(e => e.extra_id === ex.id).price : ''}">
            </div>
          `).join('')}
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>

      <div id="mi-preview" class="menu-preview-card">
        <h4>Preview</h4>
        <div class="preview-line" id="mi-preview-text">Select options above</div>
        <div class="preview-price" id="mi-preview-price">—</div>
      </div>
    </form>
  `);

  // Live preview
  function updatePreview() {
    const bName = $('#mi-branch').selectedOptions[0]?.text || '';
    const pName = $('#mi-product').selectedOptions[0]?.text || '';
    const sName = $('#mi-size').selectedOptions[0]?.text || '';
    const price = $('#mi-price').value || '0';
    $('#mi-preview-text').textContent = `${pName} / ${sName} / ${bName}`;
    $('#mi-preview-price').textContent = formatMoney(price);
  }
  ['#mi-branch', '#mi-product', '#mi-size', '#mi-price'].forEach(s => {
    $(s).addEventListener('change', updatePreview);
    $(s).addEventListener('input', updatePreview);
  });
  updatePreview();

  $('#mi-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      branch_id: parseInt($('#mi-branch').value),
      product_id: parseInt($('#mi-product').value),
      size_id: parseInt($('#mi-size').value),
      price: parseFloat($('#mi-price').value),
    };
    // Collect extras
    const extras = [];
    $$('#mi-extras-list input[type="checkbox"]:checked').forEach(cb => {
      const extraId = parseInt(cb.dataset.extraId);
      const priceInput = $(`[data-extra-price="${extraId}"]`);
      extras.push({
        extra_id: extraId,
        price: parseFloat(priceInput.value || 0),
      });
    });
    data.extras = extras;

    try {
      if (isEdit) await api.put(`/menu-items/${id}`, data);
      else await api.post('/menu-items/', data);
      closeDrawer();
      toast(`Menu item ${isEdit ? 'updated' : 'created'}`, 'success');
      renderMenuItems($('#content'));
    } catch (err) { toast(err.message, 'error'); }
  });
}

// ── Shared CRUD Helpers ─────────────────────────────────────
function crudTable(items, cols, prefix) {
  if (!items.length) return '<div class="empty-state"><p>No items</p></div>';
  return `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody>${items.map(item => `<tr>
          ${cols.map(c => `<td>${c === 'created_at' ? formatDate(item[c]) : (item[c] ?? '')}</td>`).join('')}
          <td>
            <button class="btn btn-sm btn-outline" data-edit-${prefix}="${item.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-del-${prefix}="${item.id}">Delete</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function bindCrudActions(el, prefix, renderFn, formFn, apiPath) {
  // Edit buttons (unchanged)
  el.querySelectorAll(`[data-edit-${prefix}]`).forEach(b => {
    b.addEventListener('click', () => formFn(parseInt(b.dataset[`edit${capitalize(prefix)}`])));
  });

  // DELETE buttons → now use beautiful confirm pop-up
  el.querySelectorAll(`[data-del-${prefix}]`).forEach(b => {
    b.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        `Delete ${capitalize(prefix)}`,
        `Are you sure you want to delete this ${prefix}? This action cannot be undone.`,
        { danger: true }
      );
      if (!confirmed) return;

      try {
        await api.del(`${apiPath}/${b.dataset[`del${capitalize(prefix)}`]}`);
        toast(`${capitalize(prefix)} deleted`, 'success');
        renderFn(el);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Modal / Drawer / Tabs ───────────────────────────────────
function showModal(title, content) {
  html($('#modal-container'), `
    <div class="modal-header"><h3>${title}</h3><button class="btn btn-ghost btn-icon" id="modal-close-btn">✕</button></div>
    <div class="modal-body">${content}</div>
  `);
  show($('#modal-overlay'));
  $('#modal-close-btn').addEventListener('click', closeModal);
  $('#modal-overlay').addEventListener('click', (e) => {
    if (e.target === $('#modal-overlay')) closeModal();
  });
}

function closeModal() { hide($('#modal-overlay')); }

function openDrawer(title, content) {
  $('#drawer-title').textContent = title;
  html($('#drawer-content'), content);
  show($('#drawer-overlay'));
}

function closeDrawer() { hide($('#drawer-overlay')); }
$('#drawer-close').addEventListener('click', closeDrawer);
$('#drawer-overlay').addEventListener('click', (e) => {
  if (e.target === $('#drawer-overlay')) closeDrawer();
});

function setupTabs(containerId) {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const parent = container.parentElement;
      parent.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const target = parent.querySelector(`#tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── Sidebar toggle ──────────────────────────────────────────
$('#sidebar-toggle').addEventListener('click', () => {
  $('#sidebar').classList.toggle('collapsed');
  $('#sidebar').classList.toggle('open');
});

// ── Init ────────────────────────────────────────────────────
(function init() {
  if (state.token && state.user) {
    enterApp();
  } else {
    show($('#login-screen'));
    $('#login-screen').classList.add('active');
    $('#login-username').focus();
  }
})();
