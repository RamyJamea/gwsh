
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
