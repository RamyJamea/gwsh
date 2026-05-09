const API_BASE_URL = '/api/v1';

export const api = {
  async req(method, path, body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, opts);
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      if (res.status === 204) return null;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText || 'API Error');
      }
      return res.json();
    } catch (err) {
      console.error(`API Error (${method} ${path}):`, err);
      throw err;
    }
  },
  get: (p) => api.req('GET', p),
  post: (p, b) => api.req('POST', p, b),
  put: (p, b) => api.req('PUT', p, b),
  patch: (p, b) => api.req('PATCH', p, b),
  del: (p) => api.req('DELETE', p),
  
  async login(username, password) {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  }
};
