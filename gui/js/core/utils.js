// ── Utility ─────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

const html = (el, h) => { 
  el.innerHTML = h; 
  renderIcons();
};
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

function toast(msg, type = 'success') {
  const c = $('#toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  c.appendChild(t);
  renderIcons();
  setTimeout(() => t.remove(), 3500);
}
// ── ENHANCED CONFIRM POP-UP (replaces all native confirm()) ─────────────────────
async function confirmAction(title, message, options = {}) {
  const { confirmText = 'Confirm', cancelText = 'Cancel', danger = true } = options;

  return new Promise((resolve) => {
    const content = `
      <div style="padding:40px 24px; text-align:center; display:flex; flex-direction:column; align-items:center;">
        <div style="margin-bottom:24px; display:flex; justify-content:center; align-items:center; background:${danger ? 'var(--danger-bg)' : 'rgba(211, 84, 0, 0.1)'}; color:${danger ? 'var(--danger)' : 'var(--brand-primary)'}; width:80px; height:80px; border-radius:50%;">
          <i data-lucide="${danger ? 'triangle-alert' : 'help-circle'}" style="width:40px; height:40px;"></i>
        </div>
        <h3 style="margin-bottom:12px; font-size:1.5rem; color:#111827;">${title}</h3>
        <p style="color:var(--text-muted); font-size:1.05rem; margin-bottom:32px; max-width:380px; line-height:1.6;">${message}</p>
        <div style="display:flex; gap:16px; justify-content:center; width:100%; max-width:340px;">
          <button id="confirm-cancel-btn" class="btn btn-outline" style="flex:1; padding:0.75rem;">${cancelText}</button>
          <button id="confirm-proceed-btn" class="btn btn-${danger ? 'danger' : 'primary'}" style="flex:1; padding:0.75rem;">${confirmText}</button>
        </div>
      </div>
    `;

    showModal(title, content, false);
    renderIcons();

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

function alertModal(title, message) {
  return new Promise((resolve) => {
    const content = `
      <div style="padding:40px 24px; text-align:center; display:flex; flex-direction:column; align-items:center;">
        <div style="margin-bottom:24px; display:flex; justify-content:center; align-items:center; background:var(--warning-bg); color:var(--warning); width:80px; height:80px; border-radius:50%;">
          <i data-lucide="triangle-alert" style="width:40px; height:40px;"></i>
        </div>
        <h3 style="margin-bottom:12px; font-size:1.5rem; color:#111827;">${title}</h3>
        <p style="color:var(--text-muted); font-size:1.05rem; margin-bottom:32px; max-width:380px; line-height:1.6;">${message}</p>
        <div style="display:flex; justify-content:center; width:100%;">
          <button id="alert-ok-btn" class="btn btn-primary" style="min-width:140px; padding:0.75rem;">OK</button>
        </div>
      </div>
    `;

    showModal(title, content, false);
    renderIcons();

    setTimeout(() => {
      const ok = document.getElementById('alert-ok-btn');
      const closeBtn = document.getElementById('modal-close-btn');

      const doResolve = () => {
        closeModal();
        resolve();
      };

      ok?.addEventListener('click', doResolve);
      if (closeBtn) closeBtn.addEventListener('click', doResolve);
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) doResolve();
        });
      }
    }, 30);
  });
}

function formatMoney(n) {
  return parseFloat(n || 0).toFixed(2);
}

function formatDate(d) {
  if (!d) return '—';
  let dateStr = String(d);
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr += 'Z';
  }
  return new Date(dateStr).toLocaleString('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true
  });
}
// ── NEW: Free table when order is canceled or completed ─────────────────────
async function finalizeOrder(orderId) {
  try {
    const order = await api.get(`/orders/${orderId}`);
    if (order && order.table_id) {
      await api.patch(`/tables/${order.table_id}`, { is_available: true });
    }
  } catch (err) {
    console.warn('Could not free table after finalize:', err.message);
    // silent fail – do not block the UI
  }
}
function isAdmin() { return state.role === 'admin' || state.role === 'admin'; }
function isCashier() { return state.role === 'cashier' || state.role === 'cashier'; }
