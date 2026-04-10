
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
        <div class="cart-actions" style="flex-direction:row; padding:0; background:transparent; margin:1.5rem 0; box-shadow:none;">
          <button id="detail-add-items" class="btn btn-outline" style="flex:1;">Add Items</button>
          <button id="detail-checkout" class="btn btn-primary" style="flex:1;">Checkout</button>
          <button id="detail-cancel" class="btn btn-danger" style="flex:1;">Cancel</button>
        </div>`;
    }

    openDrawer(`Order #${orderId} — ${isActive ? 'Active' : 'Completed'}`, `
      <div class="flex justify-between items-center mb-4">
        <h3 class="mb-0">Order #${orderId}</h3>
        ${isAdmin() ? `
        <button id="drawer-export-excel" class="btn btn-success">
          📥 Export History (Excel)
        </button>` : ''}
      </div>

      ${actionsHtml}

      <div class="tabs" id="order-tabs">
        <div class="tab-item active" data-tab="summary">Summary</div>
        <div class="tab-item" data-tab="items">Items</div>
        <div class="tab-item" data-tab="timeline">History (Detailed)</div>
      </div>

      <!-- SUMMARY -->
      <div class="tab-content active" id="tab-summary">
        <div class="card">
          <div class="card-body">
            <p><strong>Table:</strong> ${order.table_id ? `T${order.table_id}` : 'Walk-in / Takeaway'}</p>
            <p><strong>Status:</strong> <span class="badge badge-${actionBadge(order.action)}">${order.action}</span></p>
            <p><strong>Payment:</strong> ${order.payment_method || '—'}</p>
            <p><strong>Total:</strong> <span class="tabular-nums font-bold">${formatMoney(order.total_amount)}</span></p>
            <p><strong>Created:</strong> ${formatDate(order.created_at)}</p>
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
      <div class="cart-items" style="max-height:420px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding:0;">
        ${itemsToShow.map(item => `
          <div class="card" style="margin-bottom:0; box-shadow:none;">
            <div class="card-body" style="padding:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <strong style="font-size:1.1rem; color:var(--text-main);">${item.menu_item_name || `Item #${item.menu_item_id || item.id}`}</strong>
                  <div style="margin-top:4px; color:var(--text-muted); font-weight:600;">× ${item.quantity} 
                    <span style="font-weight:400; font-size:0.85rem;">(@ ${formatMoney(item.price_at_time || item.price || 0)})</span>
                  </div>
                </div>
                <div class="tabular-nums font-bold" style="font-size:1.1rem; color:var(--brand-primary);">
                  ${formatMoney(item.quantity * (item.price_at_time || item.price || 0))}
                </div>
              </div>
              
              ${item.order_item_extras && item.order_item_extras.length ? `
                <div style="margin-top:12px; padding:10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-md); font-size:0.85rem;">
                  <strong style="color:var(--text-muted);">Extras:</strong>
                  ${item.order_item_extras.map(e =>
            `${e.extra_name || e.name || `Extra #${e.menu_item_extra_id}`}${e.quantity > 1 ? ` <span class="badge badge-info" style="font-size:0.7rem; padding:0.1rem 0.4rem;">×${e.quantity}</span>` : ''}`
          ).join(' • ')}
                </div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
      })()}
</div>


      <!-- DETAILED HISTORY TIMELINE (NEW) -->
      <div class="tab-content" id="tab-timeline">
        ${historyData.length ? historyData.map(h => `
          <div class="history-entry card" style="margin-bottom:1rem; box-shadow:none;">
            <div class="card-body" style="padding:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px dashed var(--border); padding-bottom:12px;">
                <div>
                  <strong style="color:var(--text-main); font-size:1.05rem;">${formatDate(h.timestamp)}</strong>
                  <span class="badge badge-${actionBadge(h.action)}" style="margin-left:8px;">${h.action}</span>
                </div>
                <div class="text-sm">
                  by <strong style="color:var(--brand-primary);">${h.cashier_name || 'Unknown'}</strong>
                </div>
                <div class="tabular-nums font-bold" style="font-size:1.1rem;">
                  ${formatMoney(h.total_amount_at_time)}
                </div>
              </div>

              <!-- Items + Extras for this snapshot -->
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${h.order_history_items && h.order_history_items.length ?
            h.order_history_items.map(item => `
                    <div style="padding:10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:0.9rem; display:flex; flex-direction:column;">
                      <div style="display:flex; justify-content:space-between;">
                        <span><strong style="color:var(--text-main);">${item.menu_item_name}</strong> <span style="color:var(--text-muted); font-weight:600;">× ${item.quantity}</span></span>
                        <span class="tabular-nums font-bold" style="color:var(--brand-primary);">${formatMoney(item.price_at_time)}</span>
                      </div>
                      ${item.order_item_extras && item.order_item_extras.length ? `
                        <div style="margin-top:6px; font-size:0.85rem; color:var(--text-muted);">
                          <strong style="color:var(--text-main);">Extras:</strong> ${item.order_item_extras.map(e =>
              `${e.extra_name}${e.quantity > 1 ? ` ×${e.quantity}` : ''}`
            ).join(', ')}
                        </div>` : ''}
                    </div>
                  `).join('') :
            '<div class="text-muted" style="text-align:center; padding:10px;">No items in this snapshot</div>'}
              </div>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="margin-top:2rem;"><p>No history recorded yet.</p></div>`}
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
