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
        <!-- NEW: Total Revenue for Admin -->
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value tabular-nums" id="dash-revenue">—</div></div>
        <div class="stat-card"><div class="stat-label">Available Tables</div><div class="stat-value" id="dash-available-tables">—</div></div>
      </div>
      <div class="card"><div class="card-header">Recent Activity</div><div class="card-body" id="dash-activity"><div class="loading-center"><div class="spinner"></div></div></div></div>
    `);

    try {
      const [branches, orders, menuItems, availableTables] = await Promise.all([
        api.get('/branches/'),
        state.selectedBranch ? api.get(`/orders/?branch_id=${state.selectedBranch}`) : Promise.resolve([]),
        api.get('/menu-items/').catch(() => []),
        state.selectedBranch ? api.get(`/tables/branch/${state.selectedBranch}/available`).catch(() => []) : Promise.resolve([]),
      ]);

      $('#dash-branches').textContent = branches.length;
      $('#dash-orders').textContent = orders.length;
      $('#dash-menu').textContent = menuItems.length;

      try {
        const users = await api.get('/users/');
        $('#dash-users').textContent = users.filter(u => u.is_active).length;
      } catch { $('#dash-users').textContent = '—'; }

      // ── NEW: Calculate Total Revenue (sum of all paid orders) ──
      const revenue = orders
        .filter(o => o.action === 'pay')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      $('#dash-revenue').textContent = formatMoney(revenue);
      if (state.selectedBranch) {
        $('#dash-available-tables').textContent = availableTables.length;
      } else {
        $('#dash-available-tables').textContent = '—';
      }

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
      <div class="stat-grid" style="margin-bottom: 24px;">
        <div class="stat-card"><div class="stat-label">Orders Today</div><div class="stat-value" id="dash-cashier-orders">—</div></div>
        <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value tabular-nums" id="dash-cashier-revenue">—</div></div>
        <div class="stat-card"><div class="stat-label">Available Tables</div><div class="stat-value" id="dash-cashier-tables">—</div></div>
      </div>
      <div class="card">
        <div class="card-header">Current Branch Recent Orders</div>
        <div class="card-body" id="dash-recent">
          <div class="loading-center"><div class="spinner"></div></div>
        </div>
      </div>
    `);
    try {
      const bid = state.user.branch_id;
      const [orders, availableTables] = await Promise.all([
        bid ? api.get(`/orders/?branch_id=${bid}`) : Promise.resolve([]),
        bid ? api.get(`/tables/branch/${bid}/available`).catch(() => []) : Promise.resolve([])
      ]);
      
      $('#dash-cashier-orders').textContent = orders.length;

      const revenue = orders
        .filter(o => o.action === 'pay')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      $('#dash-cashier-revenue').textContent = formatMoney(revenue);
      
      $('#dash-cashier-tables').textContent = availableTables.length;
      
      if (orders.length) {
        // Show a more generous list since it's the only thing on the page
        html($('#dash-recent'), orders.slice(0, 15).map(o =>
          `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);font-size:0.9rem;">
            <span style="font-weight:600;">Order #${o.id}</span>
            <span class="badge badge-${actionBadge(o.action)}">${o.action}</span>
            <span class="tabular-nums font-bold">${formatMoney(o.total_amount)}</span>
          </div>`
        ).join(''));
      } else {
        html($('#dash-recent'), '<div class="empty-state"><p>No orders yet for this branch</p></div>');
      }
    } catch (err) {
      html($('#dash-recent'), `<div class="error-message">Failed to load recent orders: ${err.message}</div>`);
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
