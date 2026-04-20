
// ── UPDATED renderHistory (added branch export button + per-order Excel button) ──


async function renderHistory(el) {
  html(el, `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <h2 style="margin:0;">Order History</h2>
      <div class="flex" style="gap:12px;">
        <button class="btn btn-outline" id="refresh-history">
          <i data-lucide="refresh-cw" style="width:18px;height:18px;"></i> Refresh
        </button>
        ${isAdmin() ? `
          <button id="export-branch-history" class="btn btn-success">
            <i data-lucide="download" style="width:18px;height:18px;"></i> Full Branch Excel
          </button>
          <button id="clear-branch-history" class="btn btn-danger">
            <i data-lucide="trash-2" style="width:18px;height:18px;"></i> Clear History
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
    let orders = await api.get(`/orders/?branch_id=${bid}&limit=200`);

    // Filter completed orders
    state.completedOrders = orders.filter(o => o.action === 'pay' || o.action === 'cancel');

    // ── ENRICH WITH CASHIER NAME (so the table shows everything) ──
    if (state.completedOrders.length) {
      const enriched = await Promise.all(
        state.completedOrders.map(async (order) => {
          try {
            const history = await api.get(`/history/orders/${order.id}`);
            const latest = history[history.length - 1] || {};
            return {
              ...order,
              cashier_name: latest.cashier_name || '—'
            };
          } catch {
            return { ...order, cashier_name: '—' };
          }
        })
      );
      state.completedOrders = enriched;
    }

    state.historyPage = 1;
    renderHistoryTable(el);
  } catch (err) {
    html($('#history-list'), `<div class="error-message">${err.message}</div>`);
  }

  $('#refresh-history').addEventListener('click', () => renderHistory(el));

  const branchBtn = $('#export-branch-history');
  if (branchBtn) {
    branchBtn.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        'Download Full Branch History',
        `Export detailed history of ALL orders in branch #${bid} (3 sheets)?`,
        { confirmText: 'Download', danger: false }
      );
      if (!confirmed) return;
      await api.downloadExcel(
        `/history/branches/${bid}/export-excel`,
        `branch_${bid}_detailed_history.xlsx`
      );
    });
  }

  const clearBtn = $('#clear-branch-history');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        'Clear Branch History',
        `Are you sure you want to permanently delete ALL completed and cancelled orders for branch #${bid}? This action cannot be undone.`,
        { confirmText: 'Clear Branch History', danger: true }
      );
      if (!confirmed) return;
      try {
        const res = await api.del(`/history/branches/${bid}/clear`);
        toast(res.message, 'success');
        renderHistory(el);
      } catch (err) {
        toast(err.message, 'error');
      }
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
    html(listEl, '<div class="empty-state"><div class="empty-icon"><i data-lucide="scroll-text" style="width:48px;height:48px;"></i></div><p>No completed orders</p></div>');
    return;
  }

  let htmlContent = `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Cashier</th>
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
              <td><strong>${o.cashier_name || '—'}</strong></td>
              <td><span class="badge badge-${actionBadge(o.action)}">${o.action}</span></td>
              <td>${o.payment_method || '—'}</td>
              <td class="tabular-nums font-bold">${formatMoney(o.total_amount)}</td>
              <td class="text-sm text-muted">${formatDate(o.created_at)}</td>
              <td>
                <button class="btn btn-sm btn-outline" data-view-order="${o.id}">View Details</button>
                ${isAdmin() ? `
                <button class="btn btn-sm btn-success" data-export-order="${o.id}" title="Download detailed Excel">
                  <i data-lucide="download" style="width:16px;height:16px;margin-right:4px;"></i> Excel
                </button>
                <button class="btn btn-sm btn-danger" data-delete-order="${o.id}" title="Delete Order">
                  <i data-lucide="trash-2" style="width:16px;height:16px;margin-right:4px;"></i> Delete
                </button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

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

  // Pagination listeners
  $('#history-prev')?.addEventListener('click', () => { if (state.historyPage > 1) { state.historyPage--; renderHistoryTable(el); } });
  $('#history-next')?.addEventListener('click', () => { if (state.historyPage < totalPages) { state.historyPage++; renderHistoryTable(el); } });
  $('#history-page-size')?.addEventListener('change', (e) => {
    state.historyPageSize = parseInt(e.target.value);
    state.historyPage = 1;
    renderHistoryTable(el);
  });

  // View button
  listEl.querySelectorAll('[data-view-order]').forEach(btn => {
    btn.addEventListener('click', () => showOrderDetail(parseInt(btn.dataset.viewOrder)));
  });

  // Per-order Excel
  listEl.querySelectorAll('[data-export-order]').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = parseInt(btn.dataset.exportOrder);
      api.downloadExcel(`/history/orders/${orderId}/export-excel`, `order_${orderId}_detailed_history.xlsx`);
    });
  });

  // Delete Order
  listEl.querySelectorAll('[data-delete-order]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderId = parseInt(btn.dataset.deleteOrder);
      const confirmed = await confirmAction('Delete Order', `Permanently delete Order #${orderId} and its full history?`, { danger: true });
      if (!confirmed) return;
      try {
        await api.del(`/history/orders/${orderId}`);
        toast(`Order #${orderId} deleted successfully`, 'success');
        renderHistory(el);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

