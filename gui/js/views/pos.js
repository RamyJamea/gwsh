// ── POS ─────────────────────────────────────────────────────
async function renderPOS(el) {
  html(el, `
    <div id="pos-container">
      <!-- FLOOR VIEW -->
      <div id="pos-floor-view">
        <div class="page-header">
          <h2>Floor Plan</h2>
          <p class="text-muted">Select an available table or start a direct walk-in order</p>
        </div>
        <div id="floor-grid" class="table-grid"></div>
        <div style="text-align:center; margin-top: 40px; margin-bottom: 40px;">
          <button id="pos-takeaway-btn" class="btn btn-primary" style="padding: 1.5rem 3rem; font-size: 1.25rem; font-weight:800; border-radius: var(--radius-pill); box-shadow: 0 10px 30px rgba(0,229,255,0.3);">
            <i data-lucide="shopping-bag" style="width:28px;height:28px;margin-right:12px;"></i>
            Start Walk-in / Takeaway Order
          </button>
        </div>
      </div>

      <!-- MENU HUB VIEW -->
      <div id="pos-menu-view" class="hidden">
        <div class="pos-layout">
          <!-- LEFT SIDE: MENU -->
          <div class="pos-main-panel">
            <div class="pos-categories" id="pos-cats"><div class="loading-center"><div class="spinner"></div></div></div>
            <div class="pos-products-area">
              <div class="pos-search">
                <input type="text" id="pos-search-input" placeholder="Search menu by name...">
              </div>
              <div id="pos-product-grid" class="product-grid"><div class="loading-center"><div class="spinner"></div></div></div>
            </div>
          </div>

          <!-- RIGHT SIDE: TICKET -->
          <div class="pos-cart-panel">
            <div class="cart-header">
              <span class="cart-header-title">Order Ticket</span>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="cart-table-pill" id="cart-table-label">No Table</span>
                <button class="btn btn-sm btn-ghost" id="cart-pick-table" title="Change Table"><i data-lucide="refresh-cw" style="width:16px;height:16px;"></i></button>
              </div>
            </div>
            
            <div class="cart-items" id="cart-items"></div>
            
            <div class="cart-summary-area" id="cart-summary"></div>
            
            <div class="cart-actions">
              <button class="btn-checkout w-full" id="cart-checkout-btn" disabled>Pay / Checkout</button>
              <div class="action-row">
                <button class="btn-hold" id="cart-hold-btn">Hold Order</button>
                <button class="btn-clear" id="cart-clear-btn">Clear Items</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const bid = state.selectedBranch;
  if (!bid) {
    html(el, '<div class="empty-state"><p>Select a branch first</p></div>');
    return;
  }

  /** FIXED: Race-condition protection */
  const currentVersion = ++state.posRenderVersion;

  try {
    const [cats, itemsRes] = await Promise.all([
      api.get('/categories/'),
      api.get(`/menu-items/branch/${bid}`),
    ]);

    if (state.posRenderVersion !== currentVersion) return; // newer render started

    state.categories = cats;
    state.menuItems = itemsRes;

    if (!state.extras?.length) {
      state.extras = await api.get('/extras/');
      if (state.posRenderVersion !== currentVersion) return;
    }

    // Parallel detail loading (much faster)
    const detailPromises = state.menuItems.map(mi =>
      api.get(`/menu-items/${mi.id}`).catch(() => ({ menu_items_extras: [] }))
    );
    const details = await Promise.all(detailPromises);

    if (state.posRenderVersion !== currentVersion) return;

    for (let i = 0; i < state.menuItems.length; i++) {
      state.menuItems[i].menu_items_extras = details[i].menu_items_extras || [];
    }

    await enrichMenuItems();

    if (state.posRenderVersion !== currentVersion) return;

    initializePOSMenu();
    setupPOSFloor(bid);
  } catch (err) {
    console.error(err);
    html(el, `<div class="error-message">Failed to load menu: ${err.message}</div>`);
  }
}

// ── NEW: Reorganized New Order helpers ─────────────────────────────
function initializePOSMenu() {
  // Search
  $('#pos-search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = state.menuItems.filter(mi =>
      (mi._productName || '').toLowerCase().includes(q) ||
      (mi._sizeName || '').toLowerCase().includes(q)
    );
    renderPOSProducts(filtered);
  });

  // Change Table button (repurposed)
  const changeBtn = $('#cart-pick-table');
  if (changeBtn) {
    changeBtn.textContent = 'Change Table';
    changeBtn.addEventListener('click', goBackToFloor);
  }

  // Cart actions
  $('#cart-checkout-btn').addEventListener('click', handleCheckout);
  $('#cart-hold-btn').addEventListener('click', handleHold);
  $('#cart-clear-btn').addEventListener('click', () => {
    state.cart = [];
    state.cartTable = null;
    renderCart();
    $('#cart-table-label').textContent = 'No table selected';
    goBackToFloor();   // return to floor after clear
  });

  // Initial render
  renderPOSCategories(null);
  renderPOSProducts(state.menuItems);
  renderCart();
}


// ── UPDATED: Occupied tables are now clickable → open existing order ──
async function setupPOSFloor(bid) {
  const floorGrid = $('#floor-grid');

  try {
    // Fetch tables + active orders in parallel
    const [tablesRes, ordersRes] = await Promise.all([
      api.get(`/tables/branch/${bid}`),
      api.get(`/orders/?branch_id=${bid}`)
    ]);

    const tables = tablesRes || [];
    const orders = ordersRes || [];

    // Map table_id → active order (create or update)
    const activeOrders = orders.filter(o => o.action === 'create' || o.action === 'update');
    const tableOrderMap = {};
    activeOrders.forEach(o => {
      if (o.table_id) tableOrderMap[o.table_id] = o;
    });

    let h = '';
    if (tables.length) {
      h = tables.map(t => {
        const order = tableOrderMap[t.id];
        const isOccupied = !t.is_available || !!order;
        const statusClass = isOccupied ? 'occupied' : 'available';
        const statusText = isOccupied ? 'Occupied' : 'Available';
        const statusBadge = `<span class="badge ${isOccupied ? 'badge-danger' : 'badge-success'}">${statusText}</span>`;

        let footerHtml = '';
        if (!isOccupied) {
          footerHtml = `<div style="margin-top:12px;font-size:0.9rem;color:var(--primary);">Start New Order →</div>`;
        } else if (order) {
          footerHtml = `<div style="margin-top:12px;font-size:0.9rem;color:var(--primary);font-weight:600;">Order #${order.id} • Manage →</div>`;
        } else {
          footerHtml = `<div style="margin-top:12px;font-size:0.9rem;color:#999;">Occupied</div>`;
        }

        return `
          <div class="table-card ${statusClass}" data-tid="${t.id}" style="cursor:pointer;">
            <div class="table-number">T${t.id}</div>
            <div class="table-chairs">${t.num_chairs} chairs</div>
            ${statusBadge}
            ${footerHtml}
          </div>
        `;
      }).join('');
    } else {
      h = `<div class="empty-state"><div class="empty-icon"><i data-lucide="armchair" style="width:48px;height:48px;"></i></div><p>No tables configured for this branch</p></div>`;
    }

    html(floorGrid, h);

    // ALL tables are now clickable
    floorGrid.querySelectorAll('.table-card').forEach(card => {
      card.addEventListener('click', () => {
        const tid = parseInt(card.dataset.tid);
        const order = tableOrderMap[tid];

        if (order) {
          // Occupied table → open existing order (view + add/remove/checkout/cancel)
          showOrderDetail(order.id);
        } else {
          // Available table → start new order (existing behavior)
          state.cartTable = tid;
          showPOSMenuView();
        }
      });
    });
  } catch (err) {
    html(floorGrid, `<div class="error-message">Failed to load tables: ${err.message}</div>`);
  }

  // Takeaway button (unchanged)
  const tbBtn = $('#pos-takeaway-btn');
  if (tbBtn) {
    tbBtn.addEventListener('click', () => {
      state.cartTable = null;
      showPOSMenuView();
    });
  }
}


function showPOSMenuView() {
  hide($('#pos-floor-view'));
  show($('#pos-menu-view'));
  const labelEl = $('#cart-table-label');
  if (labelEl) {
    labelEl.textContent = state.cartTable ? `Table T${state.cartTable}` : 'Walk-in / Takeaway';
  }
  updateHoldButton();
}

function goBackToFloor() {
  hide($('#pos-menu-view'));
  show($('#pos-floor-view'));
}


let _productCache = {};
let _sizeCache = {};

async function enrichMenuItems() {
  // Fetch products and sizes for name display
  try {
    if (!Object.keys(_productCache).length) {
      const prods = await api.get('/products/');
      prods.forEach(p => _productCache[p.id] = p.name);
    }
  } catch { }
  try {
    if (!Object.keys(_sizeCache).length) {
      const sizes = await api.get('/sizes/');
      sizes.forEach(s => _sizeCache[s.id] = s.name);
    }
  } catch { }
  state.menuItems.forEach(mi => {
    mi._productName = _productCache[mi.product_id] || `Product ${mi.product_id}`;
    mi._sizeName = _sizeCache[mi.size_id] || `Size ${mi.size_id}`;
  });
}

function renderPOSCategories(activeCatId) {
  const el = $('#pos-cats');
  let h = `<div class="cat-item ${activeCatId === null ? 'active' : ''}" data-cat="all">All Items</div>`;
  for (const c of state.categories) {
    h += `<div class="cat-item ${activeCatId === c.id ? 'active' : ''}" data-cat="${c.id}">${c.name}</div>`;
  }
  html(el, h);
  el.querySelectorAll('.cat-item').forEach(ci => {
    ci.addEventListener('click', () => {
      const catId = ci.dataset.cat === 'all' ? null : parseInt(ci.dataset.cat);
      renderPOSCategories(catId);
      // Get category's product ids
      if (catId) {
        const prodIds = Object.entries(_productCache).length
          ? state.menuItems.filter(mi => {
            // We need category_id on product. Let's filter via product API data.
            return true; // We'll do a simpler filter
          })
          : state.menuItems;
        // Simple: filter by checking the product -> category mapping
        filterByCategory(catId);
      } else {
        renderPOSProducts(state.menuItems);
      }
    });
  });
}

async function filterByCategory(catId) {
  try {
    const prods = await api.get(`/categories/${catId}/products`);
    const prodIds = new Set(prods.map(p => p.id));
    const filtered = state.menuItems.filter(mi => prodIds.has(mi.product_id));
    renderPOSProducts(filtered);
  } catch {
    renderPOSProducts(state.menuItems);
  }
}

function renderPOSProducts(items) {
  const grid = $('#pos-product-grid');
  if (!items.length) {
    html(grid, '<div class="empty-state"><div class="empty-icon"><i data-lucide="utensils" style="width:48px;height:48px;"></i></div><p>No items found</p></div>');
    return;
  }

  // ── Group by product (product name appears only once) ─────────────────────
  const productGroups = {};
  items.forEach(mi => {
    const pid = mi.product_id;
    if (!productGroups[pid]) {
      productGroups[pid] = {
        productId: pid,
        productName: mi._productName,
        sizes: []
      };
    }
    productGroups[pid].sizes.push({
      menuItemId: mi.id,
      sizeName: mi._sizeName,
      price: mi.price,
      menuItemExtras: mi.menu_items_extras || []
    });
  });

  const grouped = Object.values(productGroups);

  let h = '';
  for (const group of grouped) {
    const hasMultiple = group.sizes.length > 1;
    const first = group.sizes[0];
    const anyExtras = group.sizes.some(s => s.menuItemExtras.length > 0);

    h += `
      <div class="product-card" 
           data-product-id="${group.productId}"
           ${hasMultiple ? 'data-multiple="true"' : `data-mi-id="${first.menuItemId}"`}>
        <div class="product-img-placeholder">${group.productName[0]}</div>
        <div class="product-card-body">
          <div class="product-name">${group.productName}</div>
          <div class="product-size">
            ${hasMultiple ? 'Multiple sizes • Select' : first.sizeName}
          </div>
          <div class="product-price">
            ${formatMoney(first.price)}${hasMultiple ? ' and up' : ''}
          </div>
          ${anyExtras ? `<div class="product-extras">+extras available</div>` : ''}
        </div>
      </div>
    `;
  }

  html(grid, h);

  // ── Click handlers ───────────────────────────────────────────────────────
  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const multiple = card.dataset.multiple === 'true';
      if (multiple) {
        const prodId = parseInt(card.dataset.productId);
        showSizeSelectionModal(prodId);
      } else {
        const miId = parseInt(card.dataset.miId);
        addProductWithExtras(miId);
      }
    });
  });
}
// ── NEW: Add item with optional extras selector ─────────────────────
async function addProductWithExtras(menuItemId) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;

  const hasExtras = !!(mi.menu_items_extras && mi.menu_items_extras.length);

  if (!hasExtras) {
    addItemToCart(mi, []);
    return;
  }

  // Build extras checkboxes
  let extrasHtml = mi.menu_items_extras.map(ex => {
    const name = ex.name ||
      (state.extras && state.extras.find(e => e.id === (ex.extra_id || ex.id))
        ? state.extras.find(e => e.id === (ex.extra_id || ex.id)).name
        : `Extra #${ex.id}`);
    return `
      <label style="display:block;padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">
        <input type="checkbox" class="extra-check" 
               data-id="${ex.id}" 
               data-price="${ex.price}" 
               data-name="${name}">
        <span style="margin-left:8px;">${name}</span>
        <span class="text-sm text-muted" style="float:right;">+${formatMoney(ex.price)}</span>
      </label>`;
  }).join('');

  showModal(`Add ${mi._productName} — Select Extras`, `
    <div style="min-height:50vh; max-height:70vh; overflow-y:auto;">
      ${extrasHtml}
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button id="confirm-extras-btn" class="btn btn-primary btn-block">Add Item + Extras</button>
      <button id="skip-extras-btn" class="btn btn-outline btn-block">Add Item (No Extras)</button>
    </div>
  `);

  // Listeners (modal is rendered synchronously)
  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-extras-btn');
    const skipBtn = document.getElementById('skip-extras-btn');

    confirmBtn.addEventListener('click', () => {
      const selected = [];
      document.querySelectorAll('#modal-container .extra-check:checked').forEach(chk => {
        selected.push({
          id: parseInt(chk.dataset.id),          // menu_item_extra_id
          name: chk.dataset.name,
          price: parseFloat(chk.dataset.price)
        });
      });
      closeModal();
      addItemToCart(mi, selected);
    });

    skipBtn.addEventListener('click', () => {
      closeModal();
      addItemToCart(mi, []);
    });
  }, 10);
}


// ── NEW: Size selection modal (called only when product has multiple sizes) ──
function showSizeSelectionModal(productId) {
  const mis = state.menuItems.filter(mi => mi.product_id === productId);
  if (!mis.length) return;

  let sizesHtml = mis.map(mi => {
    const extrasCount = mi.menu_items_extras ? mi.menu_items_extras.length : 0;
    return `
      <button class="btn btn-outline size-select-btn w-full" 
              data-mi-id="${mi.id}"
              style="justify-content:space-between; margin-bottom:8px; padding:16px; text-align:left;">
        <span style="font-weight:600;">${mi._sizeName}</span>
        <span class="tabular-nums">${formatMoney(mi.price)}</span>
        ${extrasCount ? `<span class="text-sm text-muted ml-auto">+${extrasCount} extras</span>` : ''}
      </button>
    `;
  }).join('');

  showModal(`Select size for ${mis[0]._productName}`, `
    <div style="min-height:50vh; max-height:70vh; overflow-y:auto; padding:8px;">
      ${sizesHtml}
    </div>
  `);

  // Attach listeners after modal is rendered
  setTimeout(() => {
    document.querySelectorAll('#modal-container .size-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const miId = parseInt(btn.dataset.miId);
        closeModal();
        addProductWithExtras(miId);
      });
    });
  }, 10);
}


// Helper: actually add to cart (used by both paths)
function addItemToCart(mi, selectedExtras) {
  // Check if identical item + same extras already exists
  const existing = state.cart.find(c =>
    c.menuItemId === mi.id &&
    JSON.stringify(c.extras.map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort())
  );

  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({
      menuItemId: mi.id,
      name: mi._productName,
      size: mi._sizeName,
      price: parseFloat(mi.price),
      quantity: 1,
      extras: selectedExtras
    });
  }

  renderCart();
  // toast(`✅ Added ${mi._productName}${selectedExtras.length ? ' + extras' : ''}`, 'success');
}
function renderCart() {
  const itemsEl = $('#cart-items');
  const summaryEl = $('#cart-summary');

  if (!state.cart.length) {
    html(itemsEl, '<div class="empty-state"><div class="empty-icon"><i data-lucide="shopping-cart" style="width:48px;height:48px;"></i></div><p>Cart is empty</p></div>');
    html(summaryEl, '');
    $('#cart-checkout-btn').disabled = true;
    if ($('#pos-total-items')) $('#pos-total-items').textContent = '0';
    if ($('#pos-subtotal')) $('#pos-subtotal').textContent = '0.00';
    if ($('#pos-total')) $('#pos-total').textContent = '0.00';
    return;
  }

  html(itemsEl, state.cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-qty">
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.2rem; background:var(--bg-elevated); padding:0.2rem; border-radius:var(--radius-sm)">
          <button class="btn-icon" style="width:24px;height:24px;font-size:1rem;" data-action="inc" data-idx="${idx}">+</button>
          <span style="font-size:0.9rem;">${item.quantity}</span>
          <button class="btn-icon" style="width:24px;height:24px;font-size:1rem;" data-action="dec" data-idx="${idx}">−</button>
        </div>
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-extra">${item.size}${item.extras.length ? ' · ' + item.extras.map(e => e.name).join(', ') : ''}</div>
      </div>
      <div class="cart-item-price">${formatMoney(getItemTotal(item))}</div>
    </div>
  `).join(''));

  itemsEl.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      if (btn.dataset.action === 'inc') state.cart[idx].quantity++;
      else {
        state.cart[idx].quantity--;
        if (state.cart[idx].quantity <= 0) state.cart.splice(idx, 1);
      }
      renderCart();
    });
  });

  const subtotal = state.cart.reduce((s, i) => s + getItemTotal(i), 0);
  const tax = subtotal * 0.0; // Configurable later
  const total = subtotal + tax;
  const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);

  html(summaryEl, `
    <div class="summary-row"><span>Subtotal</span><span class="tabular-nums">${formatMoney(subtotal)}</span></div>
    <div class="summary-row"><span>Tax (Included)</span><span class="tabular-nums">${formatMoney(tax)}</span></div>
    <div class="summary-total"><span>Total</span><span class="tabular-nums" style="color:var(--brand-primary);">${formatMoney(total)}</span></div>
  `);

  $('#cart-checkout-btn').disabled = false;
  if ($('#pos-total-items')) $('#pos-total-items').textContent = totalItems;
  if ($('#pos-subtotal')) $('#pos-subtotal').textContent = formatMoney(subtotal);
  if ($('#pos-total')) $('#pos-total').textContent = formatMoney(total);
  updateHoldButton();
}


async function handleCheckout() {
  if (!state.cart.length) return;
  const bid = state.selectedBranch;
  if (!bid) { toast('Select a branch first', 'warning'); return; }

  const totalWithExtras = state.cart.reduce((s, i) => s + getItemTotal(i), 0);

  showModal('Checkout', `
    <div class="form-group">
      <label>Payment Method</label>
      <select id="checkout-payment">
        <option value="cash">Cash</option>
        <option value="card">Card</option>
      </select>
    </div>

    <div class="cart-summary-row total" style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;">
      <span>Total</span>
      <span class="tabular-nums">${formatMoney(totalWithExtras)}</span>
    </div>

    <div style="margin-top:20px;display:flex;gap:8px;">
      <button class="btn btn-success btn-lg w-full" id="confirm-checkout">Confirm & Pay</button>
      <button class="btn btn-outline" id="cancel-checkout">Cancel</button>
    </div>
  `);

  $('#cancel-checkout').addEventListener('click', closeModal);
  $('#confirm-checkout').addEventListener('click', async () => {
    const payment = $('#checkout-payment').value;
    try {
      const orderData = {
        cashier_id: state.user.id,
        branch_id: bid,
        table_id: state.cartTable,
        total_amount: state.cart.reduce((s, i) => s + getItemTotal(i), 0),
        action: "create",
        payment_method: null,
        items: state.cart.map(c => ({
          menu_item_id: c.menuItemId,
          quantity: c.quantity,
          price_at_time: c.price,
          extras: c.extras.map(e => ({
            menu_item_extra_id: e.id,
            quantity: 1,
            price_at_time: e.price,
          })),
        })),
      };
      const order = await api.post('/orders/', orderData);

      await api.post(`/orders/${order.id}/checkout`, { payment_method: payment });

      // ── NEW: Free the table after successful checkout ──
      await finalizeOrder(order.id);

      state.cart = [];
      state.cartTable = null;
      closeModal();
      toast('Order completed successfully!', 'success');
      renderPOS($('#content'));   // refreshes floor view
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}


async function handleHold() {
  if (!state.cart.length) return;

  // ── NEW: Block takeaway orders from being held ─────────────────────
  if (state.cartTable === null) {
    toast('Takeaway orders cannot be held.\nPlease assign a table or checkout directly.', 'warning');
    return;
  }

  const bid = state.selectedBranch;
  if (!bid) {
    toast('Select a branch first', 'warning');
    return;
  }

  try {
    const orderData = {
      cashier_id: state.user.id,
      branch_id: bid,
      table_id: state.cartTable,
      total_amount: state.cart.reduce((s, i) => s + getItemTotal(i), 0),
      action: "create",
      payment_method: null,
      items: state.cart.map(c => ({
        menu_item_id: c.menuItemId,
        quantity: c.quantity,
        price_at_time: c.price,
        extras: c.extras.map(e => ({
          menu_item_extra_id: e.id,
          quantity: 1,
          price_at_time: e.price,
        })),
      })),
    };

    const order = await api.post('/orders/', orderData);

    state.cart = [];
    state.cartTable = null;
    toast(`Order #${order.id} held successfully!`, 'success');
    renderPOS($('#content'));
  } catch (err) {
    toast(err.message, 'error');
  }
}


// ── NEW: Prevent Hold for takeaway orders ─────────────────────────────
function updateHoldButton() {
  const holdBtn = $('#cart-hold-btn');
  if (!holdBtn) return;
  const isTakeaway = state.cartTable === null;
  holdBtn.disabled = isTakeaway;
  holdBtn.title = isTakeaway
    ? 'Hold is not allowed for takeaway / walk-in orders'
    : '';
}


// Improved checkout modal
async function handleHeldCheckout(orderId) {
  showModal(`Checkout Order #${orderId}`, `
    <div style="padding:24px;">
      <div class="form-group">
        <label style="font-weight:600;">Payment Method</label>
        <select id="held-checkout-payment" style="width:100%; padding:12px; border-radius:8px; font-size:1.1rem;">
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div style="margin-top:24px; padding:16px; background:#f0fdf4; border-radius:12px; text-align:center;">
        <div class="text-muted">Total to pay</div>
        <div style="font-size:2rem; font-weight:700;" id="checkout-total">—</div>
      </div>

      <div style="margin-top:28px; display:flex; gap:12px;">
        <button class="btn btn-success btn-lg w-full" id="confirm-held-checkout"><i data-lucide="check-circle" style="width:20px;height:20px;margin-right:8px;"></i> Confirm & Complete Order</button>
        <button class="btn btn-outline btn-lg w-full" id="cancel-held-checkout">Cancel</button>
      </div>
    </div>
  `);

  try {
    const order = await api.get(`/orders/${orderId}`);
    $('#checkout-total').textContent = formatMoney(order.total_amount);
  } catch { }

  $('#cancel-held-checkout').addEventListener('click', closeModal);
  $('#confirm-held-checkout').addEventListener('click', async () => {
    const payment = $('#held-checkout-payment').value;
    try {
      await api.post(`/orders/${orderId}/checkout`, { payment_method: payment });

      // ── NEW: Free the table after successful checkout ──
      await finalizeOrder(orderId);

      closeModal();
      closeDrawer();
      toast('<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Order paid successfully!</div>', 'success');
      renderPOS($('#content'));   // refreshes floor view
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}


async function addItemToHeldOrderWithExtras(orderId, menuItemId, onSuccess = null) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;

  const hasExtras = !!(mi.menu_items_extras && mi.menu_items_extras.length);

  if (!hasExtras) {
    await addItemToHeldOrder(orderId, menuItemId, [], onSuccess);
    toast(`<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Added ${mi._productName}</div>`, 'success');
    return;
  }

  let extrasHtml = mi.menu_items_extras.map(ex => {
    const name = ex.name ||
      (state.extras && state.extras.find(e => e.id === (ex.extra_id || ex.id))
        ? state.extras.find(e => e.id === (ex.extra_id || ex.id)).name
        : `Extra #${ex.id}`);
    return `
      <label style="display:block;padding:10px 12px;border-bottom:1px solid #eee;cursor:pointer;">
        <input type="checkbox" class="extra-check" 
               data-id="${ex.id}" 
               data-price="${ex.price}" 
               data-name="${name}">
        <span style="margin-left:8px;">${name}</span>
        <span class="text-sm text-muted" style="float:right;">+${formatMoney(ex.price)}</span>
      </label>`;
  }).join('');

  showModal(`Add ${mi._productName} to Order #${orderId} — Select Extras`, `
    <div style="min-height:50vh; max-height:70vh; overflow-y:auto;">
      ${extrasHtml}
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button id="confirm-extras-held-btn" class="btn btn-primary btn-block">Add Item + Extras</button>
      <button id="skip-extras-held-btn" class="btn btn-outline btn-block">Add Item (No Extras)</button>
    </div>
  `);

  setTimeout(() => {
    const confirmBtn = document.getElementById('confirm-extras-held-btn');
    const skipBtn = document.getElementById('skip-extras-held-btn');

    confirmBtn.addEventListener('click', async () => {
      const selected = [];
      document.querySelectorAll('#modal-container .extra-check:checked').forEach(chk => {
        selected.push({ id: parseInt(chk.dataset.id), name: chk.dataset.name, price: parseFloat(chk.dataset.price) });
      });
      await addItemToHeldOrder(orderId, menuItemId, selected, onSuccess);
      toast(`<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Added ${mi._productName} with extras</div>`, 'success');
      showAddItemsToOrder(orderId, onSuccess); // Reopen the search modal to continue adding
    });

    skipBtn.addEventListener('click', async () => {
      await addItemToHeldOrder(orderId, menuItemId, [], onSuccess);
      toast(`<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="check-circle" style="width:18px;height:18px;"></i> Added ${mi._productName}</div>`, 'success');
      showAddItemsToOrder(orderId, onSuccess); // Reopen the search modal to continue adding
    });
  }, 10);
}


// ── IMPROVED: In-place refresh (no drawer close/reopen) + confirm on zero quantity ──
async function updateOrderItemQuantity(orderId, orderItemId, newQty) {
  if (newQty < 1) {
    const confirmed = await confirmAction(
      'Remove Item',
      'Set quantity to 0? This will remove the item from the order.',
      { danger: true }
    );
    if (!confirmed) return;
    await removeOrderItem(orderId, orderItemId);
    return;
  }

  try {
    await api.patch(`/orders/${orderId}/items/${orderItemId}`, { quantity: newQty });
    toast('✅ Quantity updated', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function removeOrderItem(orderId, orderItemId) {
  try {
    await api.del(`/orders/${orderId}/items/${orderItemId}`);
    toast('✅ Item removed', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}




async function showAddItemsToOrder(orderId, onSuccess = null) {
  const bid = state.selectedBranch;
  if (!bid) return toast('Select a branch first', 'warning');

  try {
    if (!state.menuItems?.length || !state.menuItems[0]?.menu_items_extras) {
      state.menuItems = await api.get(`/menu-items/branch/${bid}`);
      await enrichMenuItems();

      for (const mi of state.menuItems) {
        try {
          const detail = await api.get(`/menu-items/${mi.id}`);
          mi.menu_items_extras = detail.menu_items_extras || [];
        } catch (e) {
          mi.menu_items_extras = [];
        }
      }
    }

    showModal(`Add Items to Order #${orderId}`, `
      <div style="min-height:50vh; max-height:70vh; overflow-y:auto;">
        <div class="pos-search" style="margin-bottom:12px;">
          <input type="text" id="add-search-input" placeholder="Search products to add..." style="width:100%;">
        </div>
        <div id="add-product-grid" class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));"></div>
      </div>
    `);

    const grid = document.getElementById('add-product-grid');
    const searchInput = document.getElementById('add-search-input');

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
          // Visual feedback click
          card.style.opacity = '0.5';
          setTimeout(() => card.style.opacity = '1', 200);
          
          await addItemToHeldOrderWithExtras(orderId, miId, onSuccess);
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
}


async function addItemToHeldOrder(orderId, menuItemId, selectedExtras = [], onSuccess = null) {
  const mi = state.menuItems.find(m => m.id === menuItemId);
  if (!mi) return;
  const addData = {
    items: [{
      menu_item_id: menuItemId,
      quantity: 1,
      price_at_time: parseFloat(mi.price),
      extras: selectedExtras.map(e => ({
        menu_item_extra_id: e.id,
        quantity: 1,
        price_at_time: e.price,
      })),
    }]
  };
  try {
    await api.post(`/orders/${orderId}/items`, addData);
    if (onSuccess) onSuccess();
    else if (state.currentRoute === 'orders') renderOrders($('#content'));
  } catch (err) {
    toast(err.message, 'error');
  }
}
