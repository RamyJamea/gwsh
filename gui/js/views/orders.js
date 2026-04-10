
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



async function showOrderDetail(orderId) {
  try {
    const [order, historyData] = await Promise.all([
      api.get(`/orders/${orderId}`),
      api.get(`/history/orders/${orderId}`).catch(() => [])
    ]);

    const isActive = order.action === 'create' || order.action === 'update';
    const canEdit = isCashier() && isActive;

    let actionsHtml = '';
    if (canEdit) {
      actionsHtml = `
        <div class="cart-actions" style="display:flex; gap:10px; margin:1.5rem 0;">
          <button id="detail-add-items" class="btn btn-outline" style="flex:1;">+ Add Items</button>
          <button id="detail-cancel" class="btn btn-outline btn-danger" style="flex:1;">Cancel</button>
          <button id="detail-checkout" class="btn btn-primary" style="flex:2;">Checkout</button>
        </div>`;
    }

    openDrawer(`Order #${orderId}`, `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="mb-1" style="font-size: 1.5rem; color: var(--text-main);">Order #${orderId}</h3>
          <span class="text-sm text-muted">${isActive ? 'Active Order' : 'Completed Order'}</span>
        </div>
        ${isAdmin() ? `
        <button id="drawer-export-excel" class="btn btn-sm btn-outline">
          📥 Export Excel
        </button>` : ''}
      </div>

      ${actionsHtml}

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

      <!-- ITEMS (full products + extras) -->
      <div class="tab-content" id="tab-items">
        ${(() => {
          // Use latest history snapshot (has correct names) or fall back to order
          const latestHistory = historyData.length ? historyData[historyData.length - 1] : null;
          const itemsToShow = latestHistory?.order_history_items || order.order_items || [];

          if (!itemsToShow.length) {
            return `<div class="empty-state"><p>No items in this order</p></div>`;
          }

          return `
            <div style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
              <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem;">
                ${itemsToShow.map(item => `
                  <li style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <div style="flex: 1;">
                      <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${item.menu_item_name || `Item #${item.menu_item_id || item.id}`}</span>
                        <span style="color: var(--text-muted); font-size: 0.9rem;">×${item.quantity}</span>
                      </div>
                      ${item.order_item_extras && item.order_item_extras.length ? `
                        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">
                          ${item.order_item_extras.map(e => `
                            <span style="background: var(--bg-main); color: var(--text-muted); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; border: 1px solid var(--border);">
                              + ${e.extra_name || e.name || `Extra #${e.menu_item_extra_id}`} ${e.quantity > 1 ? `(×${e.quantity})` : ''}
                            </span>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                    <div class="tabular-nums font-bold" style="color: var(--text-main);">
                      ${formatMoney(item.quantity * (item.price_at_time || item.price || 0))}
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

    // Export button
    $('#drawer-export-excel')?.addEventListener('click', () => {
      api.downloadExcel(`/history/orders/${orderId}/export-excel`, `order_${orderId}_detailed_history.xlsx`);
    });

    if (canEdit) {
      $('#detail-add-items')?.addEventListener('click', () => showAddItemsToOrder(orderId, () => showOrderDetail(orderId)));
      $('#detail-checkout')?.addEventListener('click', () => handleHeldCheckout(orderId));
      $('#detail-cancel')?.addEventListener('click', async () => {
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
