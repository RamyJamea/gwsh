
// ── Navigation ──────────────────────────────────────────────
const NAV_CASHIER = [
  { section: 'Workspace' },
  { id: 'dashboard', label: 'Dashboard', icon: '<i data-lucide="bar-chart-2"></i>' },
  { id: 'pos', label: 'New Order', icon: '<i data-lucide="shopping-cart"></i>' },
  // ── Active Orders screen removed for cashiers ──
  // They now manage ALL orders (new + existing) directly from the floor screen
  { id: 'history', label: 'Order History', icon: '<i data-lucide="scroll-text"></i>' },
  { section: 'Account' },
  { id: 'profile', label: 'Profile', icon: '<i data-lucide="user"></i>' },
];


const NAV_ADMIN = [
  { section: 'Overview' },
  { id: 'dashboard', label: 'Dashboard', icon: '<i data-lucide="bar-chart-2"></i>' },
  { section: 'POS' },
  { id: 'orders', label: 'Active Orders', icon: '<i data-lucide="clipboard-list"></i>' },
  { id: 'tables', label: 'Tables', icon: '<i data-lucide="armchair"></i>' },
  { id: 'history', label: 'Order History', icon: '<i data-lucide="scroll-text"></i>' },
  { section: 'Management' },
  { id: 'management', label: 'Management', icon: '<i data-lucide="settings"></i>' },   // ← new single page
  { section: 'Account' },
  { id: 'profile', label: 'Profile', icon: '<i data-lucide="user"></i>' },
];


function buildSidebar() {
  const nav = $('#sidebar-nav');
  const items = isAdmin() ? NAV_ADMIN : NAV_CASHIER;
  let h = '';
  for (const item of items) {
    if (item.section) {
      h += `<div class="nav-section">${item.section}</div>`;
    } else {
      h += `<div class="nav-item ${state.currentRoute === item.id ? 'active' : ''}" data-route="${item.id}" title="${item.label}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
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
  html($('#topbar-user'), `<div class="user-avatar">${(u.username || '?')[0].toUpperCase()}</div><span style="font-weight:600;">${u.username}</span>`);

  // Sidebar small avatar and text
  html($('#sidebar-user'), `${(u.username || '?')[0].toUpperCase()}`);
  const sFooterName = document.getElementById('sidebar-footer-name');
  if (sFooterName) sFooterName.textContent = u.username;

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

  // Show detailed menu button if branch is assigned
  const viewMenuBtn = $('#view-detailed-menu-btn');
  if (state.selectedBranch) {
    viewMenuBtn.classList.remove('hidden');
    viewMenuBtn.onclick = () => showDetailedBranchMenu(state.selectedBranch);
  } else {
    viewMenuBtn.classList.add('hidden');
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
        <div class="empty-icon" style="display:flex; justify-content:center;"><i data-lucide="ban" style="width:64px;height:64px;"></i></div>
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
    management: renderManagement,
  };

  const renderer = pages[route];
  if (renderer) renderer(content);
  else html(content, '<div class="empty-state"><div class="empty-icon"><i data-lucide="search" style="width:48px;height:48px;"></i></div><p>Page not found</p></div>');
}
