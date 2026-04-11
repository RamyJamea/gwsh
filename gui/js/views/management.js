
// ── Consolidated Admin Management (one page with tabs) ─────────────
async function renderManagement(el) {
  html(el, `
    <div class="page-header"><h2 style="display:flex;align-items:center;"><i data-lucide="settings" style="width:28px;height:28px;margin-right:8px;"></i> Management</h2></div>
    <div class="tabs" id="management-tabs">
      <div class="tab-item active" data-tab="branches"><i data-lucide="building" style="width:18px;height:18px;"></i> Branches</div>
      <div class="tab-item" data-tab="users"><i data-lucide="users" style="width:18px;height:18px;"></i> Users</div>
      <div class="tab-item" data-tab="categories"><i data-lucide="folder" style="width:18px;height:18px;"></i> Categories</div>
      <div class="tab-item" data-tab="products"><i data-lucide="package" style="width:18px;height:18px;"></i> Products</div>
      <div class="tab-item" data-tab="sizes"><i data-lucide="ruler" style="width:18px;height:18px;"></i> Sizes</div>
      <div class="tab-item" data-tab="extras"><i data-lucide="sparkles" style="width:18px;height:18px;"></i> Extras</div>
      <div class="tab-item" data-tab="menu-items"><i data-lucide="utensils" style="width:18px;height:18px;"></i> Menu Items</div>
    </div>
    <div id="management-content" style="margin-top:24px;"></div>
  `);

  const tabs = $('#management-tabs');
  tabs.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      state.currentAdminTab = tabName;
      loadManagementTab(tabName);
    });
  });

  // Load first tab
  state.currentAdminTab = 'branches';
  loadManagementTab('branches');
}

async function loadManagementTab(tabName) {
  const content = $('#management-content');
  if (tabName === 'branches') await renderBranchesTab(content);
  else if (tabName === 'users') await renderUsersTab(content);
  else if (tabName === 'categories') await renderCategoriesTab(content);
  else if (tabName === 'products') await renderProductsTab(content);
  else if (tabName === 'sizes') await renderSizesTab(content);
  else if (tabName === 'extras') await renderExtrasTab(content);
  else if (tabName === 'menu-items') await renderMenuItemsTab(content);
}

function refreshCurrentTab() {
  if (state.currentRoute === 'management') {
    loadManagementTab(state.currentAdminTab);
  }
}


// ── Tab Renderers (Consolidated Management Page) ─────────────────────────────

async function renderBranchesTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-branch-tab-btn" style="margin-bottom:16px;">Add Branch</button>
    <div id="branches-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const branches = await api.get('/branches/');
    state.branches = branches;

    if (!branches.length) {
      html($('#branches-list-tab'), '<div class="empty-state"><div class="empty-icon"><i data-lucide="building" style="width:48px;height:48px;"></i></div><p>No branches</p></div>');
    } else {
      html($('#branches-list-tab'), `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              ${branches.map(b => `<tr>
                <td>${b.id}</td>
                <td><strong>${b.name}</strong></td>
                <td class="text-sm text-muted">${formatDate(b.created_at)}</td>
                <td>
                  <button class="btn btn-sm btn-outline" data-edit-branch="${b.id}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-del-branch="${b.id}">Delete</button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `);

      $('#branches-list-tab').querySelectorAll('[data-edit-branch]').forEach(btn => {
        btn.addEventListener('click', () => showBranchForm(parseInt(btn.dataset.editBranch)));
      });

      $('#branches-list-tab').querySelectorAll('[data-del-branch]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const confirmed = await confirmAction('Delete Branch', `Delete branch #${btn.dataset.delBranch}?`, { danger: true });
          if (!confirmed) return;
          try {
            await api.del(`/branches/${btn.dataset.delBranch}`);
            toast('Branch deleted', 'success');
            refreshCurrentTab();           // ← important
          } catch (err) { toast(err.message, 'error'); }
        });
      });
    }
  } catch (err) {
    html($('#branches-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-branch-tab-btn').addEventListener('click', () => showBranchForm());
}

async function renderUsersTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-user-tab-btn" style="margin-bottom:16px;">Add User</button>
    <div id="users-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const users = await api.get('/users/');
    state.users = users;

    html($('#users-list-tab'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Username</th><th>Role</th><th>Branch</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td><strong>${u.username}</strong></td>
              <td><span class="badge badge-info">${u.role}</span></td>
              <td>${u.branch_id}</td>
              <td><span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td><button class="btn btn-sm btn-outline" data-edit-user="${u.id}">Edit</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `);

    $('#users-list-tab').querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', () => showUserForm(parseInt(btn.dataset.editUser)));
    });
  } catch (err) {
    html($('#users-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-user-tab-btn').addEventListener('click', () => showUserForm());
}

async function renderCategoriesTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-cat-tab-btn" style="margin-bottom:16px;">Add Category</button>
    <div id="cat-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const cats = await api.get('/categories/');
    state.categories = cats;
    html($('#cat-list-tab'), crudTable(cats, ['id', 'name', 'created_at'], 'cat'));
    bindCrudActionsForTab($('#cat-list-tab'), 'cat', refreshCurrentTab, showCategoryForm, '/categories');
  } catch (err) {
    html($('#cat-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-cat-tab-btn').addEventListener('click', () => showCategoryForm());
}

async function renderProductsTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-prod-tab-btn" style="margin-bottom:16px;">Add Product</button>
    <div id="prod-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const [prods, cats] = await Promise.all([api.get('/products/'), api.get('/categories/')]);
    state.products = prods;
    state.categories = cats;

    const catMap = {};
    cats.forEach(c => catMap[c.id] = c.name);

    html($('#prod-list-tab'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>${prods.map(p => `<tr>
            <td>${p.id}</td>
            <td>${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">` : '<div style="width:40px;height:40px;border-radius:4px;background:var(--bg-lighter);display:flex;align-items:center;justify-content:center;"><i data-lucide="image" style="width:20px;height:20px;color:var(--text-muted);"></i></div>'}</td>
            <td><strong>${p.name}</strong></td>
            <td>${catMap[p.category_id] || p.category_id}</td>
            <td>
              <button class="btn btn-sm btn-outline" data-edit-prod="${p.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-del-prod="${p.id}">Delete</button>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `);

    const container = $('#prod-list-tab');
    container.querySelectorAll('[data-edit-prod]').forEach(b => {
      b.addEventListener('click', () => showProductForm(parseInt(b.dataset.editProd)));
    });
    container.querySelectorAll('[data-del-prod]').forEach(b => {
      b.addEventListener('click', async () => {
        const confirmed = await confirmAction('Delete Product', `Delete product #${b.dataset.delProd}?`, { danger: true });
        if (!confirmed) return;
        try {
          await api.del(`/products/${b.dataset.delProd}`);
          toast('Product deleted', 'success');
          refreshCurrentTab();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  } catch (err) {
    html($('#prod-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-prod-tab-btn').addEventListener('click', () => showProductForm());
}

async function renderSizesTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-size-tab-btn" style="margin-bottom:16px;">Add Size</button>
    <div id="size-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const sizes = await api.get('/sizes/');
    state.sizes = sizes;
    html($('#size-list-tab'), crudTable(sizes, ['id', 'name'], 'size'));
    bindCrudActionsForTab($('#size-list-tab'), 'size', refreshCurrentTab, showSizeForm, '/sizes');
  } catch (err) {
    html($('#size-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-size-tab-btn').addEventListener('click', () => showSizeForm());
}

async function renderExtrasTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-extra-tab-btn" style="margin-bottom:16px;">Add Extra</button>
    <div id="extra-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  try {
    const extras = await api.get('/extras/');
    state.extras = extras;
    html($('#extra-list-tab'), crudTable(extras, ['id', 'name'], 'extra'));
    bindCrudActionsForTab($('#extra-list-tab'), 'extra', refreshCurrentTab, showExtraForm, '/extras');
  } catch (err) {
    html($('#extra-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-extra-tab-btn').addEventListener('click', () => showExtraForm());
}

async function renderMenuItemsTab(el) {
  html(el, `
    <button class="btn btn-primary" id="add-mi-tab-btn" style="margin-bottom:16px;">Add Menu Item</button>
    <div id="mi-list-tab"><div class="loading-center"><div class="spinner"></div></div></div>
  `);

  const bid = state.selectedBranch;
  if (!bid) {
    html($('#mi-list-tab'), '<div class="empty-state"><p>Select a branch first</p></div>');
    return;
  }

  try {
    const [items, prods, sizes, extras] = await Promise.all([
      api.get(`/menu-items/branch/${bid}`),   // ← FIXED: now respects selected branch
      api.get('/products/'),
      api.get('/sizes/'),
      api.get('/extras/'),
    ]);

    state.menuItems = items;
    state.products = prods;
    state.sizes = sizes;
    state.extras = extras;

    const pMap = {}; prods.forEach(p => pMap[p.id] = p.name);
    const sMap = {}; sizes.forEach(s => sMap[s.id] = s.name);

    html($('#mi-list-tab'), `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Size</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(mi => `
              <tr>
                <td>${mi.id}</td>
                <td><strong>${pMap[mi.product_id] || mi.product_id}</strong></td>
                <td>${sMap[mi.size_id] || mi.size_id}</td>
                <td class="tabular-nums font-bold">${formatMoney(mi.price)}</td>
                <td>
                  <button class="btn btn-sm btn-outline" data-edit-mi="${mi.id}">Edit</button>
                  <button class="btn btn-sm btn-danger" data-del-mi="${mi.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `);

    const container = $('#mi-list-tab');
    container.querySelectorAll('[data-edit-mi]').forEach(b => {
      b.addEventListener('click', () => showMenuItemForm(parseInt(b.dataset.editMi)));
    });
    container.querySelectorAll('[data-del-mi]').forEach(b => {
      b.addEventListener('click', async () => {
        const confirmed = await confirmAction('Delete Menu Item', `Delete menu item #${b.dataset.delMi}?`, { danger: true });
        if (!confirmed) return;
        try {
          await api.del(`/menu-items/${b.dataset.delMi}`);
          toast('Menu item deleted', 'success');
          refreshCurrentTab();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  } catch (err) {
    html($('#mi-list-tab'), `<div class="error-message">${err.message}</div>`);
  }

  $('#add-mi-tab-btn').addEventListener('click', () => showMenuItemForm());
}
// Helper for tab-based CRUD (replaces bindCrudActions when using tabs)
function bindCrudActionsForTab(container, prefix, refreshFn, formFn, apiPath) {
  container.querySelectorAll(`[data-edit-${prefix}]`).forEach(b => {
    b.addEventListener('click', () => formFn(parseInt(b.dataset[`edit${capitalize(prefix)}`])));
  });

  container.querySelectorAll(`[data-del-${prefix}]`).forEach(b => {
    b.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        `Delete ${capitalize(prefix)}`,
        `Are you sure you want to delete this ${prefix}?`,
        { danger: true }
      );
      if (!confirmed) return;
      try {
        await api.del(`${apiPath}/${b.dataset[`del${capitalize(prefix)}`]}`);
        toast(`${capitalize(prefix)} deleted`, 'success');
        refreshFn();
      } catch (err) { toast(err.message, 'error'); }
    });
  });
}


function showBranchForm(branchId = null) {
  const isEdit = !!branchId;
  const branch = isEdit ? state.branches.find(b => b.id === branchId) : null;
  openDrawer(isEdit ? 'Edit Branch' : 'Add Branch', `
    <form id="branch-form">
      <div class="form-group">
        <label>Branch Name</label>
        <input type="text" id="bf-name" value="${branch ? branch.name : ''}" required>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#branch-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { name: $('#bf-name').value.trim() };
    try {
      if (isEdit) await api.put(`/branches/${branchId}`, data);
      else await api.post('/branches/', data);
      closeDrawer();
      toast(`Branch ${isEdit ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { toast(err.message, 'error'); }
  });
}


function showUserForm(userId = null) {
  const isEdit = !!userId;
  const user = isEdit ? state.users.find(u => u.id === userId) : null;
  openDrawer(isEdit ? 'Edit User' : 'Add User', `
    <form id="user-form">
      <div class="form-group">
        <label>Branch</label>
        <select id="uf-branch" required>
          ${state.branches.map(b => `<option value="${b.id}" ${user && user.branch_id === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="uf-username" value="${user ? user.username : ''}" required>
      </div>
      <div class="form-group">
        <label>Role</label>
        <select id="uf-role">
          <option value="cashier" ${user && user.role === 'cashier' ? 'selected' : ''}>Cashier</option>
          <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
      ${!isEdit ? `<div class="form-group"><label>Password</label><input type="password" id="uf-password" required></div>` : ''}
      ${isEdit ? `
        <div class="form-group">
          <label>Active</label>
          <select id="uf-active">
            <option value="true" ${user && user.is_active ? 'selected' : ''}>Active</option>
            <option value="false" ${user && !user.is_active ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      ` : ''}
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.patch(`/users/${userId}`, {
          branch_id: parseInt($('#uf-branch').value),
          username: $('#uf-username').value.trim(),
          role: $('#uf-role').value,
          is_active: $('#uf-active').value === 'true',
        });
      } else {
        await api.post('/users/', {
          branch_id: parseInt($('#uf-branch').value),
          username: $('#uf-username').value.trim(),
          role: $('#uf-role').value,
          password: $('#uf-password').value,
        });
      }
      closeDrawer();
      toast(`User ${isEdit ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { 
      if (err.message.includes('UNIQUE constraint failed: users.username') || 
          err.message.toLowerCase().includes('already exists') || 
          err.message.includes('IntegrityError')) {
        alertModal('Username Taken', 'A user with this username already exists. Please choose a different username.');
      } else {
        alertModal('Error', err.message);
      }
    }
  });
}


function showCategoryForm(id = null) {
  const item = id ? state.categories.find(c => c.id === id) : null;
  openDrawer(id ? 'Edit Category' : 'Add Category', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/categories/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/categories/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Category ${id ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { toast(err.message, 'error'); }
  });
}


function showProductForm(id = null) {
  const item = id ? state.products.find(p => p.id === id) : null;
  openDrawer(id ? 'Edit Product' : 'Add Product', `
    <form id="entity-form">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="ef-name" value="${item ? item.name : ''}" required>
      </div>
      <div class="form-group">
        <label>Product Image (Optional)</label>
        <div id="ef-image-zone" style="border:2px dashed var(--border);border-radius:8px;padding:20px;text-align:center;cursor:pointer;position:relative;transition:border-color 0.2s,background 0.2s;">
          <input type="file" id="ef-image-file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
          <div id="ef-image-preview">
            ${item && item.image_url
              ? `<img src="${item.image_url}" style="max-width:100%;max-height:140px;border-radius:6px;object-fit:contain;">`
              : `<div style="color:var(--text-muted);pointer-events:none;"><i data-lucide="image-plus" style="width:36px;height:36px;margin-bottom:8px;"></i><br><span style="font-size:0.85rem;">Click to select an image</span></div>`
            }
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select id="ef-cat" required>
          ${state.categories.map(c => `<option value="${c.id}" ${item && item.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" id="ef-submit-btn" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  if (window.lucide) lucide.createIcons();

  // Live preview when a file is selected
  $('#ef-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      $('#ef-image-preview').innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:140px;border-radius:6px;object-fit:contain;">`;
      $('#ef-image-zone').style.borderColor = 'var(--primary)';
    };
    reader.readAsDataURL(file);
  });

  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#ef-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    let finalImageUrl = item ? item.image_url : null;
    const fileInput = $('#ef-image-file');

    if (fileInput.files.length > 0) {
      try {
        const uploadRes = await api.upload('/upload/image', fileInput.files[0]);
        finalImageUrl = uploadRes.url;
      } catch(err) {
        toast('Image upload failed: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = id ? 'Update' : 'Create';
        return;
      }
    }

    const data = {
      name: $('#ef-name').value.trim(),
      category_id: parseInt($('#ef-cat').value),
      image_url: finalImageUrl
    };
    try {
      if (id) await api.put(`/products/${id}`, data);
      else await api.post('/products/', data);
      closeDrawer();
      toast(`Product ${id ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = id ? 'Update' : 'Create';
    }
  });
}


function showSizeForm(id = null) {
  const item = id ? state.sizes.find(s => s.id === id) : null;
  openDrawer(id ? 'Edit Size' : 'Add Size', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/sizes/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/sizes/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Size ${id ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { toast(err.message, 'error'); }
  });
}


function showExtraForm(id = null) {
  const item = id ? state.extras.find(e => e.id === id) : null;
  openDrawer(id ? 'Edit Extra' : 'Add Extra', `
    <form id="entity-form">
      <div class="form-group"><label>Name</label><input type="text" id="ef-name" value="${item ? item.name : ''}" required></div>
      <button type="submit" class="btn btn-primary btn-block">${id ? 'Update' : 'Create'}</button>
    </form>
  `);
  $('#entity-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      if (id) await api.put(`/extras/${id}`, { name: $('#ef-name').value.trim() });
      else await api.post('/extras/', { name: $('#ef-name').value.trim() });
      closeDrawer();
      toast(`Extra ${id ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { toast(err.message, 'error'); }
  });
}


function showMenuItemForm(id = null) {
  const isEdit = !!id;
  const item = isEdit ? state.menuItems.find(m => m.id === id) : null;

  openDrawer(isEdit ? 'Edit Menu Item' : 'New Menu Item', `
    <form id="mi-form">
      <div class="form-group">
        <label>Branch</label>
        <select id="mi-branch" required>
          ${state.branches.map(b => {
    const isSelected = isEdit
      ? (item.branch_id === b.id)
      : (b.id === state.selectedBranch);   // ← THIS WAS THE FIX
    return `<option value="${b.id}" ${isSelected ? 'selected' : ''}>${b.name}</option>`;
  }).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Product</label>
        <select id="mi-product" required>
          ${state.products.map(p => `<option value="${p.id}" ${item && item.product_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Size</label>
        <select id="mi-size" required>
          ${state.sizes.map(s => `<option value="${s.id}" ${item && item.size_id === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Price</label>
        <input type="number" id="mi-price" step="0.01" min="0" value="${item ? item.price : ''}" required>
      </div>
      <div class="form-group">
        <label>Extras</label>
        <div id="mi-extras-list">
          ${state.extras.map(ex => `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <input type="checkbox" id="mix-${ex.id}" data-extra-id="${ex.id}" ${item && item.menu_items_extras && item.menu_items_extras.find(e => e.extra_id === ex.id) ? 'checked' : ''}>
              <label for="mix-${ex.id}" style="flex:1;margin:0;">${ex.name}</label>
              <input type="number" step="0.01" min="0" placeholder="Price" style="width:80px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:0.8rem;"
                data-extra-price="${ex.id}" value="${item && item.menu_items_extras && item.menu_items_extras.find(e => e.extra_id === ex.id) ? item.menu_items_extras.find(e => e.extra_id === ex.id).price : ''}">
            </div>
          `).join('')}
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Update' : 'Create'}</button>

      <div id="mi-preview" class="menu-preview-card">
        <h4>Preview</h4>
        <div class="preview-line" id="mi-preview-text">Select options above</div>
        <div class="preview-price" id="mi-preview-price">—</div>
      </div>
    </form>
  `);

  // Live preview (unchanged)
  function updatePreview() {
    const bName = $('#mi-branch').selectedOptions[0]?.text || '';
    const pName = $('#mi-product').selectedOptions[0]?.text || '';
    const sName = $('#mi-size').selectedOptions[0]?.text || '';
    const price = $('#mi-price').value || '0';
    $('#mi-preview-text').textContent = `${pName} / ${sName} / ${bName}`;
    $('#mi-preview-price').textContent = formatMoney(price);
  }
  ['#mi-branch', '#mi-product', '#mi-size', '#mi-price'].forEach(s => {
    $(s).addEventListener('change', updatePreview);
    $(s).addEventListener('input', updatePreview);
  });
  updatePreview();

  $('#mi-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      branch_id: parseInt($('#mi-branch').value),
      product_id: parseInt($('#mi-product').value),
      size_id: parseInt($('#mi-size').value),
      price: parseFloat($('#mi-price').value),
    };

    const extras = [];
    $$('#mi-extras-list input[type="checkbox"]:checked').forEach(cb => {
      const extraId = parseInt(cb.dataset.extraId);
      const priceInput = $(`[data-extra-price="${extraId}"]`);
      extras.push({
        extra_id: extraId,
        price: parseFloat(priceInput.value || 0),
      });
    });
    data.extras = extras;

    try {
      if (isEdit) await api.put(`/menu-items/${id}`, data);
      else await api.post('/menu-items/', data);
      closeDrawer();
      toast(`Menu item ${isEdit ? 'updated' : 'created'}`, 'success');
      refreshCurrentTab();
    } catch (err) { toast(err.message, 'error'); }
  });
}


// ── Shared CRUD Helpers ─────────────────────────────────────
function crudTable(items, cols, prefix) {
  if (!items.length) return '<div class="empty-state"><p>No items</p></div>';
  return `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody>${items.map(item => `<tr>
          ${cols.map(c => `<td>${c === 'created_at' ? formatDate(item[c]) : (item[c] ?? '')}</td>`).join('')}
          <td>
            <button class="btn btn-sm btn-outline" data-edit-${prefix}="${item.id}">Edit</button>
            <button class="btn btn-sm btn-danger" data-del-${prefix}="${item.id}">Delete</button>
          </td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function bindCrudActions(el, prefix, renderFn, formFn, apiPath) {
  // Edit buttons (unchanged)
  el.querySelectorAll(`[data-edit-${prefix}]`).forEach(b => {
    b.addEventListener('click', () => formFn(parseInt(b.dataset[`edit${capitalize(prefix)}`])));
  });

  // DELETE buttons → now use beautiful confirm pop-up
  el.querySelectorAll(`[data-del-${prefix}]`).forEach(b => {
    b.addEventListener('click', async () => {
      const confirmed = await confirmAction(
        `Delete ${capitalize(prefix)}`,
        `Are you sure you want to delete this ${prefix}? This action cannot be undone.`,
        { danger: true }
      );
      if (!confirmed) return;

      try {
        await api.del(`${apiPath}/${b.dataset[`del${capitalize(prefix)}`]}`);
        toast(`${capitalize(prefix)} deleted`, 'success');
        renderFn(el);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
