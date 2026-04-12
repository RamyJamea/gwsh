
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
      html($('#orders-list'), '<div class="empty-state"><div class="empty-icon"><i data-lucide="clipboard-list" style="width:48px;height:48px;"></i></div><p>No active orders</p></div>');
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
          await finalizeOrder(parseInt(btn.dataset.cancelOrder));   // ← NEW
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



async function showOrderDetail(orderId, defaultTab = null) {
  try {
    const [order, historyData] = await Promise.all([
      api.get(`/orders/${orderId}`),
      api.get(`/history/orders/${orderId}`).catch(() => [])
    ]);

    const isActive = order.action === 'create' || order.action === 'update';
    const canEdit = isCashier() && isActive;

    openDrawer(`Order #${orderId}`, `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="mb-1" style="font-size: 1.5rem; color: var(--text-main);">Order #${orderId}</h3>
          <span class="text-sm text-muted">${isActive ? 'Active Order' : 'Completed Order'}</span>
        </div>
        ${isAdmin() ? `
        <button id="drawer-export-excel" class="btn btn-sm btn-outline">
          <i data-lucide="download" style="width:16px;height:16px;margin-right:6px;"></i> Export Excel
        </button>` : ''}
      </div>

      <div class="tabs" id="order-tabs" style="margin-bottom: 1.5rem;">
        <div class="tab-item active" data-tab="summary">Summary</div>
        <div class="tab-item" data-tab="items">Items</div>
        ${canEdit ? `
        <div class="tab-item" data-tab="add-items" style="color:var(--brand-primary);">+ Add Items</div>
        <div class="tab-item" data-tab="checkout" style="color:var(--success);">Checkout</div>
        ` : ''}
        <div class="tab-item" data-tab="timeline">History</div>
      </div>

      <!-- SUMMARY -->
      <div class="tab-content active" id="tab-summary">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background: var(--bg-elevated); padding: 1.5rem; border-radius: var(--radius-md);">
          <div>
            <div class="text-sm text-muted mb-1">Table / Type</div>
            <div style="font-weight: 500; color: var(--text-main);">${order.table_id ? `T${order.table_id}` : 'Walk-in / Takeaway'}</div>
          </div>
          <div>
            <div class="text-sm text-muted mb-1">Status</div>
            <div><span class="badge badge-${actionBadge(order.action)}">${order.action}</span></div>
          </div>
          <div>
            <div class="text-sm text-muted mb-1">Payment Method</div>
            <div style="font-weight: 500; color: var(--text-main);">${order.payment_method || '—'}</div>
          </div>
          <div>
            <div class="text-sm text-muted mb-1">Created At</div>
            <div style="font-weight: 500; color: var(--text-main);">${formatDate(order.created_at)}</div>
          </div>
          <div style="grid-column: span 2; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div class="text-muted">Total Amount</div>
            <div class="tabular-nums font-bold" style="font-size: 1.5rem; color: var(--brand-primary);">${formatMoney(order.total_amount)}</div>
          </div>
        </div>
      </div>

      ${canEdit ? `
      <!-- ADD ITEMS TAB -->
      <div class="tab-content" id="tab-add-items">
        <div id="add-items-main-view" style="display:flex; flex-direction:column; height: 100%;">
          <div class="pos-search" style="margin-bottom:12px; flex-shrink: 0;">
            <input type="text" id="drawer-add-search-input" placeholder="Search products to add..." style="width:100%;">
          </div>
          <div id="drawer-add-product-grid" class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); max-height: 40vh; overflow-y:auto; padding-right:8px; border-bottom: 2px dashed var(--border); padding-bottom: 12px; margin-bottom: 12px;">
            <div class="loading-center"><div class="spinner"></div></div>
          </div>
          <div id="drawer-pending-items-container" style="flex: 1; min-height: 15vh; display:flex; flex-direction:column;">
             <h4 style="margin-bottom: 8px;">Pending Additions</h4>
             <div id="drawer-pending-items-list" style="overflow-y:auto; flex: 1; margin-bottom: 12px;"></div>
             <button id="drawer-save-pending-btn" class="btn btn-success btn-lg w-full hidden">Save Items</button>
          </div>
        </div>
        <div id="add-items-extras-view" class="hidden" style="background:#fff; border-radius:12px; padding:16px; border:1px solid var(--border);">
           <h4 id="add-items-extras-title" style="margin-bottom:12px;">Select Extras</h4>
           <div id="add-items-extras-list" style="margin-bottom:20px; max-height: 50vh; overflow-y:auto;"></div>
           <div style="display:flex; gap:8px;">
             <button id="add-items-confirm-extras" class="btn btn-primary w-full">Confirm & Add</button>
             <button id="add-items-skip-extras" class="btn btn-outline w-full">Skip Extras</button>
             <button id="add-items-cancel-extras" class="btn btn-ghost w-full">Cancel</button>
           </div>
        </div>
      </div>

      <!-- CHECKOUT TAB -->
      <div class="tab-content" id="tab-checkout">
        <div style="background:#f8f9fa; padding:20px; border-radius:12px;">
          <h3 style="margin-bottom:16px;">Checkout Order</h3>
          <div class="form-group">
            <label style="font-weight:600;">Payment Method</label>
            <select id="drawer-checkout-payment" style="width:100%; padding:12px; border-radius:8px; font-size:1.1rem;">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div style="margin:24px 0; padding:16px; background:#fff; border-radius:12px; text-align:center; border: 1px solid var(--border);">
            <div class="text-muted">Total to pay</div>
            <div style="font-size:2rem; font-weight:800; color:var(--brand-primary);">${formatMoney(order.total_amount)}</div>
          </div>
          <button class="btn btn-success btn-lg w-full" id="drawer-confirm-checkout" style="margin-bottom: 24px;"><i data-lucide="check-circle" style="width:20px;height:20px;margin-right:8px;"></i> Confirm & Complete Order</button>
          
          <div style="border-top: 1px dashed var(--border); padding-top: 16px;">
             <button class="btn btn-outline btn-danger w-full" id="drawer-cancel-order">Cancel Order</button>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- ITEMS (full products + extras) -->
      <div class="tab-content" id="tab-items">
        ${(() => {
        let itemsToShow = [];

        if (canEdit) {
          // For active orders, use the fresh order items instead of potentially stale history snapshot
          itemsToShow = order.order_items || [];
        } else {
          // For completed orders, prefer the history snapshot since the data structure is permanently locked
          const latestHistory = historyData.length ? historyData[historyData.length - 1] : null;
          itemsToShow = latestHistory?.order_history_items || order.order_items || [];
        }

        if (!itemsToShow.length) {
          return `<div class="empty-state"><p>No items in this order</p></div>`;
        }

        // Aggregate visually
        const aggregated = [];
        itemsToShow.forEach(item => {
          const extras = item.order_item_extras || item.extras || [];
          const existing = aggregated.find(agg => {
            if (agg.menu_item_id !== item.menu_item_id) return false;
            if (agg.extras.length !== extras.length) return false;
            const e1 = agg.extras.map(e => e.menu_item_extra_id || e.id).sort().join(',');
            const e2 = extras.map(e => e.menu_item_extra_id || e.id).sort().join(',');
            return e1 === e2;
          });

          if (existing) {
            existing.quantity += item.quantity;
            existing.total_price += (item.quantity * (item.price_at_time || item.price || 0));
          } else {
            let productName = item.menu_item_name;
            if (!productName) {
              const mi = state.menuItems?.find(m => m.id === item.menu_item_id);
              productName = mi ? (mi._productName || `Item #${mi.id}`) : `Item #${item.menu_item_id || item.id}`;
            }
            aggregated.push({
              ...item,
              productName,
              extras,
              quantity: item.quantity || 1,
              total_price: ((item.quantity || 1) * (item.price_at_time || item.price || 0))
            });
          }
        });

        return `
            <div style="max-height: 70vh; overflow-y: auto; padding-right: 8px;">
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem;">
                ${aggregated.map(agg => `
                  <li style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <div style="flex: 1;">
                      <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${agg.productName}</span>
                      </div>
                      ${agg.extras.length ? `
                        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">
                          ${agg.extras.map(e => `
                            <span style="background: var(--bg-main); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid var(--border);">
                              + ${e.extra_name || e.name || `Extra #${e.menu_item_extra_id || e.id}`} ${e.quantity > 1 ? `(×${e.quantity})` : ''}
                            </span>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                      <div class="tabular-nums font-bold" style="color: var(--text-main);">
                        ${formatMoney(agg.total_price)}
                      </div>
                      <span style="color: var(--text-muted); font-size: 0.95rem; font-weight: 600;">Qty: ${agg.quantity}</span>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>`;
      })()}
      </div>

      <!-- DETAILED HISTORY TIMELINE -->
      <div class="tab-content" id="tab-timeline">
        ${historyData.length ? `
          <div style="margin-left: 8px; border-left: 2px solid var(--border); padding-left: 24px; display: flex; flex-direction: column; gap: 2rem; position: relative;">
            ${historyData.map((h, i) => `
              <div style="position: relative;">
                <!-- Timeline dot -->
                <div style="position: absolute; left: -31px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--brand-primary); border: 2px solid var(--bg-main);"></div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                      <span class="badge badge-${actionBadge(h.action)}">${h.action}</span>
                      <span style="color: var(--text-muted); font-size: 0.85rem;">by ${h.cashier_name || 'System'}</span>
                    </div>
                    <div style="color: var(--text-main); font-weight: 500; font-size: 0.95rem;">${formatDate(h.timestamp)}</div>
                  </div>
                  <div class="tabular-nums font-bold" style="color: var(--text-main);">
                    ${formatMoney(h.total_amount_at_time)}
                  </div>
                </div>

                ${h.order_history_items && h.order_history_items.length ? `
                  <div style="background: var(--bg-elevated); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                    ${h.order_history_items.map(item => `
                      <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                        <div>
                          <span style="color: var(--text-main);">${item.menu_item_name}</span>
                          <span style="color: var(--text-muted);"> ×${item.quantity}</span>
                          ${item.order_item_extras && item.order_item_extras.length ? `
                            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
                              ${item.order_item_extras.map(e => `+ ${e.extra_name}${e.quantity > 1 ? `(×${e.quantity})` : ''}`).join(', ')}
                            </div>
                          ` : ''}
                        </div>
                        <span class="tabular-nums" style="color: var(--text-muted);">${formatMoney(item.price_at_time)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : '<div class="text-muted text-sm mt-2">No items</div>'}
              </div>
            `).join('')}
          </div>
        ` : `<div class="empty-state"><p>No history recorded yet.</p></div>`}
      </div>
    `);

    setupTabs('order-tabs');
    if (defaultTab) {
      document.querySelector(`.tab-item[data-tab="${defaultTab}"]`)?.click();
    }

    // Export button
    $('#drawer-export-excel')?.addEventListener('click', () => {
      api.downloadExcel(`/history/orders/${orderId}/export-excel`, `order_${orderId}_detailed_history.xlsx`);
    });

    if (canEdit) {
      loadDrawerAddItems(orderId);

      $('#drawer-confirm-checkout')?.addEventListener('click', async () => {
        const payment = $('#drawer-checkout-payment').value;
        try {
          await api.post(`/orders/${orderId}/checkout`, { payment_method: payment });
          await finalizeOrder(orderId);
          closeDrawer();
          toast('<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Order paid successfully!</div>', 'success');
          renderPOS($('#content'));
        } catch (err) {
          toast(err.message, 'error');
        }
      });

      $('#drawer-cancel-order')?.addEventListener('click', async () => {
        const confirmed = await confirmAction('Cancel Order', `Cancel Order #${orderId}?`, { danger: true });
        if (!confirmed) return;
        await api.post(`/orders/${orderId}/cancel`, {});
        await finalizeOrder(orderId);
        closeDrawer();
        toast('Order cancelled', 'warning');
        renderPOS($('#content'));
      });
    }

    attachOrderItemListeners(orderId);
  } catch (err) {
    toast(err.message, 'error');
  }
}
// ── Helper: re-attach listeners after refresh ──
function attachOrderItemListeners(orderId) {
  const refreshItemsTab = async () => {
    const [freshOrder] = await Promise.all([
      api.get(`/orders/${orderId}`),
      api.get(`/history/orders/${orderId}`).catch(() => [])
    ]);
    showOrderDetail(orderId); // full drawer refresh (cleanest & safest)
  };

  // Quantity buttons
  document.querySelectorAll('#tab-items .qty-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderItemId = parseInt(btn.dataset.orderItemId);
      const span = btn.parentElement.querySelector('span');
      let qty = parseInt(span.textContent);
      const newQty = btn.classList.contains('inc') ? qty + 1 : qty - 1;
      await updateOrderItemQuantity(orderId, orderItemId, newQty);
      await refreshItemsTab();
    });
  });

  // Remove buttons
  document.querySelectorAll('#tab-items .remove-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orderItemId = parseInt(btn.dataset.orderItemId);
      const confirmed = await confirmAction('Remove Item', 'Remove this item from the order?', { danger: true });
      if (!confirmed) return;
      await removeOrderItem(orderId, orderItemId);
      await refreshItemsTab();
    });
  });
}

// ── NEW: Inline Drawer Add Items logic ──
async function loadDrawerAddItems(orderId) {
  const bid = state.selectedBranch;
  if (!bid) return;

  const grid = document.getElementById('drawer-add-product-grid');
  const searchInput = document.getElementById('drawer-add-search-input');

  const mainView = document.getElementById('add-items-main-view');
  const extrasView = document.getElementById('add-items-extras-view');

  try {
    if (!state.menuItems?.length || !state.menuItems[0]?.menu_items_extras) {
      state.menuItems = await api.get(`/menu-items/branch/${bid}`);
      if (typeof enrichMenuItems === 'function') await enrichMenuItems();

      for (const mi of state.menuItems) {
        try {
          const detail = await api.get(`/menu-items/${mi.id}`);
          mi.menu_items_extras = detail.menu_items_extras || [];
        } catch (e) {
          mi.menu_items_extras = [];
        }
      }
    }

    function renderGrid(items) {
      if (!items.length) {
        grid.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
        return;
      }
      grid.innerHTML = items.map(mi => `
        <div class="product-card" data-mi-id="${mi.id}">
          <div class="product-img-placeholder">${(mi._productName || 'I')[0]}</div>
          <div class="product-card-body">
            <div class="product-name">${mi._productName || 'Item'}</div>
            <div class="product-size">${mi._sizeName || ''}</div>
            <div class="product-price">${formatMoney(mi.price)}</div>
            ${mi.menu_items_extras && mi.menu_items_extras.length ?
          `<div class="product-extras">+${mi.menu_items_extras.length} extras</div>` : ''}
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', async () => {
          const miId = parseInt(card.dataset.miId);
          handleDrawerItemClick(orderId, miId);
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

  let pendingItems = [];

  const updatePendingView = () => {
    const listEl = document.getElementById('drawer-pending-items-list');
    const btnEl = document.getElementById('drawer-save-pending-btn');
    if (!listEl || !btnEl) return;

    if (pendingItems.length === 0) {
      listEl.innerHTML = '<div class="text-muted text-sm" style="padding: 12px 0;">No items selected yet. Click products above to stage them.</div>';
      btnEl.classList.add('hidden');
      return;
    }

    const total = pendingItems.reduce((acc, pi) => acc + ((pi.quantity || 1) * (pi.price + (pi.extras || []).reduce((sc, e) => sc + e.price, 0))), 0);

    listEl.innerHTML = pendingItems.map((pi, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; padding:10px; background:var(--bg-elevated); border-radius:6px; border:1px solid var(--border);">
        <div style="min-width:0; flex:1; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; gap:6px; align-items:baseline;">
            <span style="font-size:0.9rem; color:var(--text-muted);">×${pi.quantity || 1}</span>
            <strong style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-main);">${pi.name}</strong>
          </div>
          ${pi.extras && pi.extras.length ? `<div class="text-sm text-muted" style="padding-left:22px;">+ ${pi.extras.map(e => e.name).join(', ')}</div>` : ''}
        </div>
        <div style="display:flex; gap:12px; align-items:center; flex-shrink:0;">
          <span class="tabular-nums font-bold" style="color:var(--brand-primary);">${formatMoney((pi.quantity || 1) * (pi.price + (pi.extras || []).reduce((sc, e) => sc + e.price, 0)))}</span>
          <button class="btn-icon text-danger drawer-pending-remove" data-idx="${idx}" style="cursor:pointer; background:none; border:none; padding:4px;"><i data-lucide="x" style="width:18px;height:18px;"></i></button>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.drawer-pending-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingItems.splice(parseInt(btn.dataset.idx), 1);
        updatePendingView();
      });
    });

    btnEl.textContent = `Save ${pendingItems.length} Item${pendingItems.length > 1 ? 's' : ''} (${formatMoney(total)})`;
    btnEl.classList.remove('hidden');
  };

  const btnSave = document.getElementById('drawer-save-pending-btn');
  if (btnSave) {
    const newBtnSave = btnSave.cloneNode(true);
    btnSave.parentNode.replaceChild(newBtnSave, btnSave);
    newBtnSave.addEventListener('click', async () => {
      if (pendingItems.length === 0) return;

      const payload = {
        items: pendingItems.map(pi => ({
          menu_item_id: pi.id,
          quantity: pi.quantity || 1,
          price_at_time: pi.price,
          extras: (pi.extras || []).map(e => ({
            menu_item_extra_id: e.id,
            quantity: 1,
            price_at_time: e.price
          }))
        }))
      };

      try {
        newBtnSave.disabled = true;
        newBtnSave.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;"></div>';
        await api.post(`/orders/${orderId}/items`, payload);
        toast('<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Items added successfully</div>', 'success');
        if (typeof showOrderDetail === 'function') {
          showOrderDetail(orderId, 'items');
        }
      } catch (err) {
        toast(err.message, 'error');
        newBtnSave.disabled = false;
        newBtnSave.textContent = 'Save Items...'; // Reset on fail
      }
    });
  }

  // Initial call
  updatePendingView();

  function handleDrawerItemClick(orderId, menuItemId) {
    const mi = state.menuItems.find(m => m.id === menuItemId);
    if (!mi) return;

    const addToPending = (miId, name, price, selectedExtras = []) => {
      const existing = pendingItems.find(pi =>
        pi.id === miId &&
        JSON.stringify((pi.extras || []).map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort())
      );
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        pendingItems.push({ id: miId, name, price, quantity: 1, extras: selectedExtras });
      }
      updatePendingView();
      const listEl = document.getElementById('drawer-pending-items-list');
      if (listEl) listEl.scrollTop = listEl.scrollHeight;
    };

    const hasExtras = !!(mi.menu_items_extras && mi.menu_items_extras.length);

    if (!hasExtras) {
      addToPending(mi.id, mi._productName || `Item #${mi.id}`, mi.price, []);
      return;
    }

    // Has extras -> show extras inline view
    mainView.classList.add('hidden');
    extrasView.classList.remove('hidden');

    document.getElementById('add-items-extras-title').textContent = `Select Extras for ${mi._productName || 'Item'}`;

    let extrasHtml = mi.menu_items_extras.map(ex => {
      const name = ex.name ||
        (state.extras && state.extras.find(e => e.id === (ex.extra_id || ex.id))
          ? state.extras.find(e => e.id === (ex.extra_id || ex.id)).name
          : `Extra #${ex.id}`);
      return `
        <label style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border); cursor:pointer;" class="drawer-extra-label">
          <div>
            <input type="checkbox" class="drawer-extra-check" data-id="${ex.id}" data-price="${ex.price}" data-name="${name}">
            <span style="margin-left:8px; font-weight:500;">${name}</span>
          </div>
          <span class="text-sm text-muted">+${formatMoney(ex.price)}</span>
        </label>`;
    }).join('');

    document.getElementById('add-items-extras-list').innerHTML = extrasHtml;

    const oldConfirm = document.getElementById('add-items-confirm-extras');
    const oldSkip = document.getElementById('add-items-skip-extras');
    const oldCancel = document.getElementById('add-items-cancel-extras');

    const btnConfirm = oldConfirm.cloneNode(true);
    const btnSkip = oldSkip.cloneNode(true);
    const btnCancel = oldCancel.cloneNode(true);

    oldConfirm.parentNode.replaceChild(btnConfirm, oldConfirm);
    oldSkip.parentNode.replaceChild(btnSkip, oldSkip);
    oldCancel.parentNode.replaceChild(btnCancel, oldCancel);

    btnConfirm.addEventListener('click', () => {
      const selected = [];
      document.querySelectorAll('#add-items-extras-list .drawer-extra-check:checked').forEach(chk => {
        selected.push({ id: parseInt(chk.dataset.id), name: chk.dataset.name, price: parseFloat(chk.dataset.price) });
      });
      mainView.classList.remove('hidden');
      extrasView.classList.add('hidden');

      addToPending(mi.id, mi._productName || `Item #${mi.id}`, mi.price, selected);
    });

    btnSkip.addEventListener('click', () => {
      mainView.classList.remove('hidden');
      extrasView.classList.add('hidden');

      addToPending(mi.id, mi._productName || `Item #${mi.id}`, mi.price, []);
    });

    btnCancel.addEventListener('click', () => {
      mainView.classList.remove('hidden');
      extrasView.classList.add('hidden');
    });
  }
}
