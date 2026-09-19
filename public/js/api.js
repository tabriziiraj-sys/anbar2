const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        window.location.hash = '#/login';
        throw new Error('لطفاً وارد شوید');
      }
      throw new Error(data.message || 'خطا در ارتباط با سرور');
    }

    return data;
  },

  get(url) { return this.request(url); },
  post(url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
  put(url, body) { return this.request(url, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(url) { return this.request(url, { method: 'DELETE' }); },

  // Auth
  async login(email, password) {
    const res = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'خطا در ورود');
    return data;
  },

  async logout() {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    });
  },

  async getSession() {
    const res = await fetch('/api/session', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  },

  // Products
  getProducts(params = '') { return this.get(`/api/products${params}`); },
  getProduct(id) { return this.get(`/api/products/${id}`); },
  createProduct(data) { return this.post('/api/products', data); },
  updateProduct(id, data) { return this.put(`/api/products/${id}`, data); },
  deleteProduct(id) { return this.delete(`/api/products/${id}`); },

  // Categories
  getCategories() { return this.get('/api/categories'); },
  createCategory(data) { return this.post('/api/categories', data); },
  updateCategory(id, data) { return this.put(`/api/categories/${id}`, data); },
  deleteCategory(id) { return this.delete(`/api/categories/${id}`); },

  // Units
  getUnits() { return this.get('/api/units'); },
  createUnit(data) { return this.post('/api/units', data); },
  updateUnit(id, data) { return this.put(`/api/units/${id}`, data); },
  deleteUnit(id) { return this.delete(`/api/units/${id}`); },

  // Warehouses
  getWarehouses() { return this.get('/api/warehouses'); },
  createWarehouse(data) { return this.post('/api/warehouses', data); },
  updateWarehouse(id, data) { return this.put(`/api/warehouses/${id}`, data); },
  deleteWarehouse(id) { return this.delete(`/api/warehouses/${id}`); },

  // Inventory
  getDocuments(params = '') { return this.get(`/api/inventory/documents${params}`); },
  getDocument(id) { return this.get(`/api/inventory/documents/${id}`); },
  createDocument(data) { return this.post('/api/inventory/documents', data); },
  deleteDocument(id) { return this.delete(`/api/inventory/documents/${id}`); },
  getStock(params = '') { return this.get(`/api/inventory/stock${params}`); },
  getLedger(productId, params = '') { return this.get(`/api/inventory/ledger/${productId}${params}`); },

  // Dashboard
  getDashboard() { return this.get('/api/dashboard'); },

  // Reports
  getStockReport(params = '') { return this.get(`/api/reports/stock${params}`); },
  getMovementsReport(params = '') { return this.get(`/api/reports/movements${params}`); },

  // Users
  getUsers() { return this.get('/api/users'); },
  createUser(data) { return this.post('/api/users', data); },
  updateUser(id, data) { return this.put(`/api/users/${id}`, data); },
  setUserRole(id, role) { return this.post(`/api/users/${id}/role`, { role }); },
  setUserPassword(id, newPassword) { return this.post(`/api/users/${id}/password`, { newPassword }); },
  banUser(id, reason) { return this.post(`/api/users/${id}/ban`, { banReason: reason }); },
  unbanUser(id) { return this.post(`/api/users/${id}/unban`, {}); },
  getUserSessions(id) { return this.get(`/api/users/${id}/sessions`); },
  revokeUserSessions(id) { return this.post(`/api/users/${id}/revoke-sessions`, {}); },
};
