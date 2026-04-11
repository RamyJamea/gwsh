
// ── Modal / Drawer / Tabs ───────────────────────────────────
// ── Modal / Drawer / Tabs ───────────────────────────────────
function showModal(title, content, showHeader = true) {
  let headerHtml = '';
  if (showHeader) {
    headerHtml = `<div class="modal-header"><h3 style="margin:0; font-size:1.25rem;">${title}</h3><button class="btn btn-ghost btn-icon" id="modal-close-btn"><i data-lucide="x"></i></button></div>`;
  } else {
    // If no header, we still might want a close button floating
    headerHtml = `<button class="btn btn-ghost btn-icon" id="modal-close-btn" style="position:absolute; right:16px; top:16px; z-index:10;"><i data-lucide="x"></i></button>`;
  }
  
  html($('#modal-container'), `
    ${headerHtml}
    <div class="modal-body" style="${!showHeader ? 'padding-top:24px;' : ''}">${content}</div>
  `);
  show($('#modal-overlay'));
  $('#modal-close-btn')?.addEventListener('click', closeModal);
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
// ── Sidebar toggle (updated) ──────────────────────────────────────────
const sidebarToggleBtn = $('#sidebar-toggle');
if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', () => {
    const sidebar = $('#sidebar');
    const appShell = $('#app-shell');

    sidebar.classList.toggle('collapsed');
    sidebar.classList.toggle('open');

    // This class tells the whole layout that the sidebar is hidden
    appShell.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });
}

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

// ── Detailed Menu Viewer ──────────────────────────────────
async function showDetailedBranchMenu(branchId) {
  const branchName = state.branches.find(b => b.id === branchId)?.name || `Branch #${branchId}`;
  showModal(`Detailed Menu — ${branchName}`, `<div class="loading-center"><div class="spinner"></div></div>`);
  
  try {
    const [cats, itemsRes, prods, sizes, extrasRes] = await Promise.all([
      api.get('/categories/'),
      api.get(`/menu-items/branch/${branchId}`),
      api.get('/products/'),
      api.get('/sizes/'),
      api.get('/extras/')
    ]);

    const detailPromises = itemsRes.map(mi => api.get(`/menu-items/${mi.id}`).catch(() => ({ menu_items_extras: [] })));
    const details = await Promise.all(detailPromises);
    itemsRes.forEach((mi, i) => mi.menu_items_extras = details[i].menu_items_extras || []);

    const pMap = {}; prods.forEach(p => pMap[p.id] = p);
    const sMap = {}; sizes.forEach(s => sMap[s.id] = s.name);
    const cMap = {}; cats.forEach(c => cMap[c.id] = c.name);
    const eMap = {}; extrasRes.forEach(e => eMap[e.id] = e.name);

    const tree = {};
    itemsRes.forEach(mi => {
      const prod = pMap[mi.product_id];
      if (!prod) return;
      const catName = cMap[prod.category_id] || 'Uncategorized';
      if (!tree[catName]) tree[catName] = {};
      if (!tree[catName][prod.name]) tree[catName][prod.name] = [];
      tree[catName][prod.name].push(mi);
    });

    let h = `<div style="max-height: 60vh; overflow-y: auto; padding-right: 12px; font-family: var(--font-body);">`;
    
    if (Object.keys(tree).length === 0) {
      h += `<div class="empty-state"><p>No menu items assigned to this branch.</p></div>`;
    }

    for (const [catName, products] of Object.entries(tree).sort((a,b) => a[0].localeCompare(b[0]))) {
      h += `<h3 style="margin-top: 16px; margin-bottom: 8px; border-bottom: 2px solid var(--border); padding-bottom: 4px; color: var(--primary);">${catName}</h3>`;
      
      for (const [prodName, mis] of Object.entries(products).sort((a,b) => a[0].localeCompare(b[0]))) {
        h += `<div style="margin-bottom: 12px; padding: 12px; background: var(--bg-elevated); border-radius: 8px;">`;
        h += `<div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">${prodName}</div>`;
        
        mis.forEach(mi => {
          h += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">`;
          h += `<span style="font-weight: 500;">${sMap[mi.size_id] || mi.size_id}</span>`;
          h += `<span class="tabular-nums font-bold">${formatMoney(mi.price)}</span>`;
          h += `</div>`;
          
          if (mi.menu_items_extras && mi.menu_items_extras.length) {
            h += `<div style="padding-left: 12px; border-left: 2px solid var(--border); margin-left: 4px; margin-bottom: 8px;">`;
            mi.menu_items_extras.forEach(ex => {
              const name = ex.name || eMap[ex.extra_id || ex.id] || `Extra #${ex.id}`;
              h += `<div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2px;">`;
              h += `<span>+ ${name}</span>`;
              h += `<span class="tabular-nums">+${formatMoney(ex.price)}</span>`;
              h += `</div>`;
            });
            h += `</div>`;
          }
        });
        h += `</div>`;
      }
    }
    
    h += `</div>`;
    
    const bodyEl = $('#modal-container .modal-body');
    if(bodyEl) html(bodyEl, h);

  } catch(err) {
    const bodyEl = $('#modal-container .modal-body');
    if(bodyEl) html(bodyEl, `<div class="error-message">Failed to load detailed menu: ${err.message}</div>`);
  }
}
