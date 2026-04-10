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
