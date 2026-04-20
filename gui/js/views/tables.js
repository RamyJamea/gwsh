
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
      html($('#tables-grid'), '<div class="empty-state"><div class="empty-icon"><i data-lucide="armchair" style="width:48px;height:48px;"></i></div><p>No tables configured</p></div>');
    } else {
      html($('#tables-grid'), `<div class="table-grid">${tables.map(t => `
        <div class="table-card ${t.is_available ? 'available' : 'occupied'}" data-table-id="${t.id}">
          <div class="table-number" style="font-size: 1.5rem; font-weight: 700;">Table ${t.table_number || t.id}</div>
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

async function showTableActions(tableId) {
  const t = state.tables.find(x => x.id === tableId);
  if (!t) return;

  let activeOrder = null;
  if (!t.is_available) {
    try {
      const orders = await api.get(`/orders/?branch_id=${state.selectedBranch}`);
      activeOrder = orders.find(o => o.table_id === tableId && ['create', 'update'].includes(o.action));
    } catch(err) {
      console.error(err);
    }
  }

  showModal(`Manage Table ${t.table_number || t.id}`, `
    <div style="text-align:center;margin-bottom:16px;">
      <div class="table-number" style="font-size:2rem;">${t.num_chairs} chairs</div>
      <span class="badge ${t.is_available ? 'badge-success' : 'badge-danger'}">${t.is_available ? 'Available' : 'Occupied'}</span>
      ${activeOrder ? `<div style="margin-top:8px;font-weight:600;color:var(--text-main);">Active Order #${activeOrder.id}</div>` : ''}
    </div>
    <div style="display:flex;flex-direction:row;gap:8px;justify-content:center;width:100%;">
      ${isAdmin() && !t.is_available ? `<button class="btn btn-warning" style="flex:1;" id="table-cancel-order">${activeOrder ? 'Cancel Order & Free Table' : 'Free Table'}</button>` : ''}
      ${isAdmin() ? `<button class="btn btn-outline" style="flex:1; border-color:var(--danger);color:var(--danger);" id="table-delete">Delete Table</button>` : ''}
    </div>
  `);

  if ($('#table-cancel-order')) {
    $('#table-cancel-order').addEventListener('click', async () => {
      const confirmed = await confirmAction('Confirm', activeOrder ? `Cancel Order #${activeOrder.id} and free table ${t.table_number || t.id}?` : `Free table ${t.table_number || t.id}?`, { danger: true });
      if (!confirmed) return;
      try {
        if (activeOrder) await api.post(`/orders/${activeOrder.id}/cancel`, {});
        await api.patch(`/tables/${tableId}`, { is_available: true });
        closeModal();
        toast('Table freed successfully', 'success');
        renderTables($('#content'));
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }

  if ($('#table-delete')) {
    $('#table-delete').addEventListener('click', async () => {
      const confirmed = await confirmAction(
        'Delete Table',
        `Delete Table ${t.table_number || t.id}? This action is permanent.`,
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
