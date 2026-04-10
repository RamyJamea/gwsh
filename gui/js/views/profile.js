
// ── Profile ─────────────────────────────────────────────────
function renderProfile(el) {
  const u = state.user;
  html(el, `
    <div class="page-header"><h2>Profile</h2></div>
    <div class="card" style="max-width:480px;">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div class="user-avatar" style="width:56px;height:56px;font-size:1.4rem;">${(u.username || '?')[0].toUpperCase()}</div>
          <div>
            <div class="font-bold text-lg">${u.username}</div>
            <div class="badge badge-info">${u.role}</div>
          </div>
        </div>
        <div style="font-size:0.85rem;display:grid;gap:8px;">
          <div><span class="text-muted">User ID:</span> ${u.id}</div>
          <div><span class="text-muted">Branch ID:</span> ${u.branch_id}</div>
          <div><span class="text-muted">Status:</span> <span class="badge ${u.is_active ? 'badge-success' : 'badge-danger'}">${u.is_active ? 'Active' : 'Inactive'}</span></div>
        </div>
        <hr style="margin:20px 0;border:none;border-top:1px solid var(--border);">
        <h4 style="margin-bottom:12px;">Reset Password</h4>
        <form id="reset-pw-form">
          <div class="form-group">
            <label>New Password</label>
            <input type="password" id="new-pw" required minlength="4">
          </div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  `);
  $('#reset-pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { new_password: $('#new-pw').value });
      toast('Password updated', 'success');
      $('#new-pw').value = '';
    } catch (err) { toast(err.message, 'error'); }
  });
}


