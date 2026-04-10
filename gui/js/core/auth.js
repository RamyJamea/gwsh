// ── Auth ────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const errEl = $('#login-error');
  hide(errEl);
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  if (!username || !password) {
    show(errEl);
    errEl.textContent = 'Please enter username and password.';
    return;
  }
  try {
    const data = await api.login(username, password);
    state.token = data.access_token;
    localStorage.setItem('pos_token', data.access_token);
    // Fetch profile
    const profile = await api.get('/auth/profile');
    state.user = profile;
    state.role = profile.role;
    localStorage.setItem('pos_user', JSON.stringify(profile));
    localStorage.setItem('pos_role', profile.role);
    enterApp();
  } catch (err) {
    show(errEl);
    errEl.textContent = err.message;
  }
}

function logout() {
  state.token = null;
  state.user = null;
  state.role = null;
  state.cart = [];
  state.cartTable = null;
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  localStorage.removeItem('pos_role');
  hide($('#app-shell'));
  show($('#login-screen'));
  $('#login-screen').classList.add('active');
  $('#login-username').value = '';
  $('#login-password').value = '';
  $('#login-username').focus();
}

$('#password-toggle').addEventListener('click', () => {
  const inp = $('#login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

$('#login-form').addEventListener('submit', handleLogin);
$('#logout-btn').addEventListener('click', logout);
