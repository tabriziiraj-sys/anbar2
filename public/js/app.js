// ============ STATE ============
const state = {
  user: null,
  currentPage: 'login',
  sidebarOpen: false,
};

const DOC_TYPE_LABELS = { IN: 'ورود', OUT: 'خروج', ADJUSTMENT: 'اصلاح موجودی' };

// ============ UTILITIES ============
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') e.className = v;
    else if (k === 'innerHTML') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function showToast(msg, type = 'success') {
  let container = $('.toast-container');
  if (!container) {
    container = el('div', { className: 'toast-container' });
    document.body.appendChild(container);
  }
  const toast = el('div', { className: `toast toast-${type}` }, msg);
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fa-IR'); } catch { return d; }
}

function formatNum(n) {
  if (n === null || n === undefined) return '۰';
  return new Intl.NumberFormat('fa-IR').format(n);
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============ ROUTER ============
const routes = {
  '#/login': 'login',
  '#/dashboard': 'dashboard',
  '#/products': 'products',
  '#/categories': 'categories',
  '#/units': 'units',
  '#/warehouses': 'warehouses',
  '#/inventory-in': 'inventory-in',
  '#/inventory-out': 'inventory-out',
  '#/inventory-adjustment': 'inventory-adjustment',
  '#/stock': 'stock',
  '#/card': 'card',
  '#/reports': 'reports',
  '#/users': 'users',
};

function navigate(hash) {
  window.location.hash = hash;
}

function getRoute() {
  const hash = window.location.hash || '#/login';
  return routes[hash] || 'dashboard';
}

window.addEventListener('hashchange', () => render());

// ============ AUTH ============
async function checkAuth() {
  try {
    const session = await API.getSession();
    if (session && session.user) {
      state.user = session.user;
      return true;
    }
  } catch (e) {}
  state.user = null;
  return false;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#login-email').value;
  const password = $('#login-password').value;
  const errEl = $('#login-error');
  errEl.style.display = 'none';

  try {
    await API.login(email, password);
    const session = await API.getSession();
    state.user = session.user;
    navigate('#/dashboard');
  } catch (err) {
    errEl.textContent = err.message || 'خطا در ورود';
    errEl.style.display = 'block';
  }
}

async function handleLogout() {
  await API.logout();
  state.user = null;
  navigate('#/login');
  render();
}

// ============ RENDER ============
async function render() {
  const app = $('#app');
  const authenticated = await checkAuth();
  const route = getRoute();

  if (!authenticated && route !== 'login') {
    navigate('#/login');
    return;
  }

  if (route === 'login') {
    app.innerHTML = '';
    app.appendChild(renderLogin());
    return;
  }

  app.innerHTML = '';
  app.appendChild(renderLayout(route));
}

function renderLogin() {
  return el('div', { className: 'login-page' }, [
    el('div', { className: 'login-card' }, [
      el('h1', {}, '📦 سیستم مدیریت انبار'),
      el('p', {}, 'برای ادامه وارد حساب کاربری شوید'),
      el('div', { className: 'alert alert-error', id: 'login-error', style: 'display:none' }),
      el('form', { onSubmit: handleLogin }, [
        el('div', { className: 'form-group' }, [
          el('label', {}, 'ایمیل'),
          el('input', { type: 'email', id: 'login-email', className: 'form-control', required: '', placeholder: 'admin@example.com' }),
        ]),
        el('div', { className: 'form-group' }, [
          el('label', {}, 'رمز عبور'),
          el('input', { type: 'password', id: 'login-password', className: 'form-control', required: '', placeholder: '••••••••' }),
        ]),
        el('button', { type: 'submit', className: 'btn btn-primary' }, 'ورود به سیستم'),
      ]),
    ]),
  ]);
}

function renderLayout(route) {
  const isAdmin = state.user?.role === 'admin';
  const menuItems = [
    { hash: '#/dashboard', icon: '📊', label: 'داشبورد' },
    { hash: '#/products', icon: '📦', label: 'کالاها' },
    { hash: '#/categories', icon: '🏷️', label: 'دسته‌بندی‌ها' },
    { hash: '#/units', icon: '📏', label: 'واحدها' },
    { hash: '#/warehouses', icon: '🏭', label: 'انبارها' },
    { hash: '#/inventory-in', icon: '📥', label: 'ورود کالا' },
    { hash: '#/inventory-out', icon: '📤', label: 'خروج کالا' },
    { hash: '#/inventory-adjustment', icon: '🔄', label: 'اصلاح موجودی' },
    { hash: '#/stock', icon: '📋', label: 'موجودی' },
    { hash: '#/card', icon: '🗂️', label: 'کارت کالا' },
    { hash: '#/reports', icon: '📈', label: 'گزارش‌ها' },
  ];
  if (isAdmin) menuItems.push({ hash: '#/users', icon: '👥', label: 'کاربران' });

  const sidebar = el('aside', { className: `sidebar ${state.sidebarOpen ? 'open' : ''}`, id: 'sidebar' }, [
    el('div', { className: 'sidebar-header' }, [
      el('h1', {}, '📦 مدیریت انبار'),
      el('small', {}, state.user?.name || ''),
    ]),
    el('nav', { className: 'sidebar-nav' }, [
      ...menuItems.map(item =>
        el('button', {
          className: `nav-item ${route === item.hash.slice(2) ? 'active' : ''}`,
          onClick: () => { navigate(item.hash); state.sidebarOpen = false; }
        }, [
          el('span', { className: 'icon' }, item.icon),
          el('span', {}, item.label),
        ])
      ),
      el('button', { className: 'nav-item', onClick: handleLogout }, [
        el('span', { className: 'icon' }, '🚪'),
        el('span', {}, 'خروج'),
      ]),
    ]),
  ]);

  const mainContent = el('main', { className: 'main-content', id: 'main-content' });
  const mobileBtn = el('button', {
    className: 'mobile-menu-btn',
    onClick: () => { state.sidebarOpen = !state.sidebarOpen; sidebar.classList.toggle('open'); }
  }, '☰');

  const layout = el('div', { className: 'app-layout' }, [sidebar, mainContent, mobileBtn]);

  // Render page content
  setTimeout(() => renderPage(route, mainContent), 0);

  return layout;
}

function renderPage(route, container) {
  const pages = {
    dashboard: renderDashboard,
    products: renderProducts,
    categories: renderCategories,
    units: renderUnits,
    warehouses: renderWarehouses,
    'inventory-in': () => renderInventoryDoc(container, 'IN'),
    'inventory-out': () => renderInventoryDoc(container, 'OUT'),
    'inventory-adjustment': () => renderInventoryDoc(container, 'ADJUSTMENT'),
    stock: renderStock,
    card: renderCard,
    reports: renderReports,
    users: renderUsers,
  };
  const pageFn = pages[route];
  if (pageFn) pageFn(container);
  else container.innerHTML = '<div class="empty-state"><div class="icon">❓</div><p>صفحه یافت نشد</p></div>';
}

// ============ DASHBOARD ============
async function renderDashboard(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const { data } = await API.getDashboard();
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [el('h2', {}, 'داشبورد')]));

    const stats = el('div', { className: 'stats-grid' }, [
      statCard('📦', data.productCount, 'تعداد کالاها'),
      statCard('🏷️', data.categoryCount, 'دسته‌بندی‌ها'),
      statCard('🏭', data.warehouseCount, 'انبارها'),
      statCard('📥', data.inDocCount, 'اسناد ورود'),
      statCard('📤', data.outDocCount, 'اسناد خروج'),
    ]);
    container.appendChild(stats);

    // Low stock
    if (data.lowStock.length > 0) {
      const lowCard = el('div', { className: 'card' }, [
        el('div', { className: 'card-header' }, [el('span', { className: 'card-title' }, '⚠️ کالاهای کم‌موجودی')]),
        el('div', { className: 'table-container', innerHTML: `
          <table><thead><tr><th>کد</th><th>نام</th><th>موجودی</th><th>حداقل</th><th>واحد</th></tr></thead>
          <tbody>${data.lowStock.map(i => `<tr><td>${escapeHtml(i.code)}</td><td>${escapeHtml(i.name)}</td><td><span class="badge badge-danger">${formatNum(i.currentStock)}</span></td><td>${formatNum(i.minStock)}</td><td>${escapeHtml(i.unitName||'-')}</td></tr>`).join('')}</tbody></table>
        `}),
      ]);
      container.appendChild(lowCard);
    }

    // Recent movements
    if (data.recentMovements.length > 0) {
      const recentCard = el('div', { className: 'card' }, [
        el('div', { className: 'card-header' }, [el('span', { className: 'card-title' }, '🕐 آخرین گردش‌ها')]),
        el('div', { className: 'table-container', innerHTML: `
          <table><thead><tr><th>شماره</th><th>نوع</th><th>تاریخ</th><th>ثبت‌کننده</th></tr></thead>
          <tbody>${data.recentMovements.map(d => `<tr><td>${escapeHtml(d.documentNumber)}</td><td><span class="badge badge-${d.type==='IN'?'success':d.type==='OUT'?'danger':'info'}">${DOC_TYPE_LABELS[d.type]}</span></td><td>${formatDate(d.date)}</td><td>${escapeHtml(d.creatorName||'-')}</td></tr>`).join('')}</tbody></table>
        `}),
      ]);
      container.appendChild(recentCard);
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function statCard(icon, value, label) {
  return el('div', { className: 'stat-card' }, [
    el('div', { className: 'stat-icon' }, icon),
    el('div', { className: 'stat-value' }, formatNum(value)),
    el('div', { className: 'stat-label' }, label),
  ]);
}

// ============ PRODUCTS ============
async function renderProducts(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const [prodRes, catRes, unitRes] = await Promise.all([API.getProducts(), API.getCategories(), API.getUnits()]);
    const products = prodRes.data;
    const categories = catRes.data;
    const units = unitRes.data;

    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [
      el('h2', {}, 'کالاها'),
      el('button', { className: 'btn btn-primary', onClick: () => showProductModal(null, categories, units, () => renderProducts(container)) }, '+ کالای جدید'),
    ]));

    // Search
    const searchInput = el('input', { className: 'form-control', placeholder: 'جستجو...', type: 'text' });
    searchInput.addEventListener('input', async () => {
      const res = await API.getProducts(`?search=${encodeURIComponent(searchInput.value)}`);
      renderProductsTable(container, res.data, categories, units);
    });
    container.appendChild(el('div', { className: 'filters-bar' }, [
      el('div', { className: 'form-group' }, [searchInput]),
    ]));

    renderProductsTable(container, products, categories, units);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderProductsTable(container, products, categories, units) {
  let tableEl = container.querySelector('#products-table');
  if (tableEl) tableEl.remove();

  const card = el('div', { className: 'card', id: 'products-table' });
  if (products.length === 0) {
    card.innerHTML = '<div class="empty-state"><div class="icon">📦</div><p>کالایی یافت نشد</p></div>';
  } else {
    card.innerHTML = `<div class="table-container"><table><thead><tr><th>کد</th><th>نام</th><th>دسته‌بندی</th><th>واحد</th><th>حداقل موجودی</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
    ${products.map(p => `<tr>
      <td>${escapeHtml(p.code)}</td><td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.categoryName||'-')}</td><td>${escapeHtml(p.unitName||'-')}</td>
      <td>${formatNum(p.minStock)}</td>
      <td><span class="badge ${p.isActive?'badge-success':'badge-danger'}">${p.isActive?'فعال':'غیرفعال'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})">ویرایش</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">حذف</button>
      </td></tr>`).join('')}</tbody></table></div>`;
  }
  container.appendChild(card);

  // Store refs for modal
  window._prodCategories = categories;
  window._prodUnits = units;
  window._refreshProducts = () => renderProducts(container);
}

window.editProduct = async function(id) {
  const res = await API.getProduct(id);
  showProductModal(res.data, window._prodCategories, window._prodUnits, window._refreshProducts);
};

window.deleteProduct = async function(id) {
  if (!confirm('آیا از حذف این کالا مطمئن هستید؟')) return;
  try {
    await API.deleteProduct(id);
    showToast('کالا حذف شد');
    window._refreshProducts();
  } catch (err) { showToast(err.message, 'error'); }
};

function showProductModal(product, categories, units, onSave) {
  const isEdit = !!product;
  const overlay = el('div', { className: 'modal-overlay', onClick: (e) => { if (e.target === overlay) overlay.remove(); } });
  const modal = el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('h3', {}, isEdit ? 'ویرایش کالا' : 'کالای جدید'),
      el('button', { className: 'modal-close', onClick: () => overlay.remove() }, '×'),
    ]),
    el('form', { id: 'product-form', onSubmit: async (e) => {
      e.preventDefault();
      const data = {
        code: $('#pf-code').value,
        name: $('#pf-name').value,
        barcode: $('#pf-barcode').value || null,
        categoryId: $('#pf-category').value || null,
        unitId: $('#pf-unit').value || null,
        minStock: parseFloat($('#pf-minstock').value) || 0,
        description: $('#pf-desc').value || null,
        isActive: $('#pf-active').checked,
      };
      try {
        if (isEdit) await API.updateProduct(product.id, data);
        else await API.createProduct(data);
        showToast(isEdit ? 'کالا ویرایش شد' : 'کالا ایجاد شد');
        overlay.remove();
        onSave();
      } catch (err) { showToast(err.message, 'error'); }
    }}, [
      el('div', { className: 'modal-body' }, [
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'کد کالا *'), el('input', { id: 'pf-code', className: 'form-control', required: '', value: product?.code || '' })]),
          el('div', { className: 'form-group' }, [el('label', {}, 'نام کالا *'), el('input', { id: 'pf-name', className: 'form-control', required: '', value: product?.name || '' })]),
        ]),
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'بارکد'), el('input', { id: 'pf-barcode', className: 'form-control', value: product?.barcode || '' })]),
          el('div', { className: 'form-group' }, [el('label', {}, 'حداقل موجودی'), el('input', { id: 'pf-minstock', className: 'form-control', type: 'number', value: product?.minStock || 0 })]),
        ]),
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'دسته‌بندی'), el('select', { id: 'pf-category', className: 'form-control' }, [el('option', { value: '' }, '-'), ...categories.map(c => el('option', { value: c.id, selected: product?.categoryId == c.id ? '' : undefined }, c.name))])]),
          el('div', { className: 'form-group' }, [el('label', {}, 'واحد'), el('select', { id: 'pf-unit', className: 'form-control' }, [el('option', { value: '' }, '-'), ...units.map(u => el('option', { value: u.id, selected: product?.unitId == u.id ? '' : undefined }, u.name))])]),
        ]),
        el('div', { className: 'form-group' }, [el('label', {}, 'توضیحات'), el('textarea', { id: 'pf-desc', className: 'form-control' }, product?.description || '')]),
        el('div', { className: 'form-group' }, [el('label', {}, [el('input', { id: 'pf-active', type: 'checkbox', checked: product?.isActive !== false ? '' : undefined }), ' فعال'])]),
      ]),
      el('div', { className: 'modal-footer' }, [
        el('button', { type: 'submit', className: 'btn btn-primary' }, isEdit ? 'ذخیره تغییرات' : 'ایجاد کالا'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => overlay.remove() }, 'انصراف'),
      ]),
    ]),
  ]);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ============ CATEGORIES ============
async function renderCategories(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const { data } = await API.getCategories();
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [
      el('h2', {}, 'دسته‌بندی‌ها'),
      el('button', { className: 'btn btn-primary', onClick: () => showSimpleModal('دسته‌بندی جدید', null, async (d) => await API.createCategory(d), () => renderCategories(container)) }, '+ دسته‌بندی جدید'),
    ]));

    const card = el('div', { className: 'card' });
    if (data.length === 0) {
      card.innerHTML = '<div class="empty-state"><div class="icon">🏷️</div><p>دسته‌بندی‌ای وجود ندارد</p></div>';
    } else {
      card.innerHTML = `<div class="table-container"><table><thead><tr><th>نام</th><th>توضیحات</th><th>عملیات</th></tr></thead><tbody>
      ${data.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.description||'-')}</td><td>
        <button class="btn btn-sm btn-outline" onclick="editCategory(${c.id})">ویرایش</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">حذف</button>
      </td></tr>`).join('')}</tbody></table></div>`;
    }
    container.appendChild(card);
    window._refreshCategories = () => renderCategories(container);
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

window.editCategory = async function(id) {
  const { data } = await API.getCategories();
  const item = data.find(c => c.id === id);
  showSimpleModal('ویرایش دسته‌بندی', item, async (d) => await API.updateCategory(id, d), window._refreshCategories);
};

window.deleteCategory = async function(id) {
  if (!confirm('آیا مطمئن هستید؟')) return;
  try { await API.deleteCategory(id); showToast('حذف شد'); window._refreshCategories(); }
  catch (err) { showToast(err.message, 'error'); }
};

// ============ UNITS ============
async function renderUnits(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const { data } = await API.getUnits();
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [
      el('h2', {}, 'واحدهای اندازه‌گیری'),
      el('button', { className: 'btn btn-primary', onClick: () => showSimpleModal('واحد جدید', null, async (d) => await API.createUnit(d), () => renderUnits(container)) }, '+ واحد جدید'),
    ]));

    const card = el('div', { className: 'card' });
    if (data.length === 0) {
      card.innerHTML = '<div class="empty-state"><div class="icon">📏</div><p>واحدی وجود ندارد</p></div>';
    } else {
      card.innerHTML = `<div class="table-container"><table><thead><tr><th>نام</th><th>توضیحات</th><th>عملیات</th></tr></thead><tbody>
      ${data.map(u => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.description||'-')}</td><td>
        <button class="btn btn-sm btn-outline" onclick="editUnit(${u.id})">ویرایش</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUnit(${u.id})">حذف</button>
      </td></tr>`).join('')}</tbody></table></div>`;
    }
    container.appendChild(card);
    window._refreshUnits = () => renderUnits(container);
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

window.editUnit = async function(id) {
  const { data } = await API.getUnits();
  const item = data.find(u => u.id === id);
  showSimpleModal('ویرایش واحد', item, async (d) => await API.updateUnit(id, d), window._refreshUnits);
};

window.deleteUnit = async function(id) {
  if (!confirm('آیا مطمئن هستید؟')) return;
  try { await API.deleteUnit(id); showToast('حذف شد'); window._refreshUnits(); }
  catch (err) { showToast(err.message, 'error'); }
};

// ============ WAREHOUSES ============
async function renderWarehouses(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const { data } = await API.getWarehouses();
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [
      el('h2', {}, 'انبارها'),
      el('button', { className: 'btn btn-primary', onClick: () => showWarehouseModal(null, () => renderWarehouses(container)) }, '+ انبار جدید'),
    ]));

    const card = el('div', { className: 'card' });
    if (data.length === 0) {
      card.innerHTML = '<div class="empty-state"><div class="icon">🏭</div><p>انباری وجود ندارد</p></div>';
    } else {
      card.innerHTML = `<div class="table-container"><table><thead><tr><th>کد</th><th>نام</th><th>توضیحات</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
      ${data.map(w => `<tr><td>${escapeHtml(w.code)}</td><td>${escapeHtml(w.name)}</td><td>${escapeHtml(w.description||'-')}</td>
        <td><span class="badge ${w.isActive?'badge-success':'badge-danger'}">${w.isActive?'فعال':'غیرفعال'}</span></td><td>
        <button class="btn btn-sm btn-outline" onclick="editWarehouse(${w.id})">ویرایش</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWarehouse(${w.id})">حذف</button>
      </td></tr>`).join('')}</tbody></table></div>`;
    }
    container.appendChild(card);
    window._refreshWarehouses = () => renderWarehouses(container);
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

window.editWarehouse = async function(id) {
  const { data } = await API.getWarehouses();
  const item = data.find(w => w.id === id);
  showWarehouseModal(item, window._refreshWarehouses);
};

window.deleteWarehouse = async function(id) {
  if (!confirm('آیا مطمئن هستید؟')) return;
  try { await API.deleteWarehouse(id); showToast('حذف شد'); window._refreshWarehouses(); }
  catch (err) { showToast(err.message, 'error'); }
};

function showWarehouseModal(warehouse, onSave) {
  const isEdit = !!warehouse;
  const overlay = el('div', { className: 'modal-overlay', onClick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.appendChild(el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('h3', {}, isEdit ? 'ویرایش انبار' : 'انبار جدید'),
      el('button', { className: 'modal-close', onClick: () => overlay.remove() }, '×'),
    ]),
    el('form', { onSubmit: async (e) => {
      e.preventDefault();
      const data = { code: $('#wf-code').value, name: $('#wf-name').value, description: $('#wf-desc').value || null, isActive: $('#wf-active').checked };
      try {
        if (isEdit) await API.updateWarehouse(warehouse.id, data);
        else await API.createWarehouse(data);
        showToast(isEdit ? 'ویرایش شد' : 'ایجاد شد');
        overlay.remove(); onSave();
      } catch (err) { showToast(err.message, 'error'); }
    }}, [
      el('div', { className: 'modal-body' }, [
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'کد انبار *'), el('input', { id: 'wf-code', className: 'form-control', required: '', value: warehouse?.code || '' })]),
          el('div', { className: 'form-group' }, [el('label', {}, 'نام انبار *'), el('input', { id: 'wf-name', className: 'form-control', required: '', value: warehouse?.name || '' })]),
        ]),
        el('div', { className: 'form-group' }, [el('label', {}, 'توضیحات'), el('textarea', { id: 'wf-desc', className: 'form-control' }, warehouse?.description || '')]),
        el('div', { className: 'form-group' }, [el('label', {}, [el('input', { id: 'wf-active', type: 'checkbox', checked: warehouse?.isActive !== false ? '' : undefined }), ' فعال'])]),
      ]),
      el('div', { className: 'modal-footer' }, [
        el('button', { type: 'submit', className: 'btn btn-primary' }, 'ذخیره'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => overlay.remove() }, 'انصراف'),
      ]),
    ]),
  ]));
  document.body.appendChild(overlay);
}

// ============ SIMPLE MODAL (for categories/units) ============
function showSimpleModal(title, item, saveFn, onRefresh) {
  const isEdit = !!item;
  const overlay = el('div', { className: 'modal-overlay', onClick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.appendChild(el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('h3', {}, isEdit ? `ویرایش ${title}` : title),
      el('button', { className: 'modal-close', onClick: () => overlay.remove() }, '×'),
    ]),
    el('form', { onSubmit: async (e) => {
      e.preventDefault();
      try {
        await saveFn({ name: $('#sf-name').value, description: $('#sf-desc').value || null });
        showToast(isEdit ? 'ویرایش شد' : 'ایجاد شد');
        overlay.remove(); onRefresh();
      } catch (err) { showToast(err.message, 'error'); }
    }}, [
      el('div', { className: 'modal-body' }, [
        el('div', { className: 'form-group' }, [el('label', {}, 'نام *'), el('input', { id: 'sf-name', className: 'form-control', required: '', value: item?.name || '' })]),
        el('div', { className: 'form-group' }, [el('label', {}, 'توضیحات'), el('textarea', { id: 'sf-desc', className: 'form-control' }, item?.description || '')]),
      ]),
      el('div', { className: 'modal-footer' }, [
        el('button', { type: 'submit', className: 'btn btn-primary' }, 'ذخیره'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => overlay.remove() }, 'انصراف'),
      ]),
    ]),
  ]));
  document.body.appendChild(overlay);
}

// ============ INVENTORY DOCUMENTS ============
async function renderInventoryDoc(container, type) {
  const typeLabel = DOC_TYPE_LABELS[type];
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';

  try {
    const [products, warehouses] = await Promise.all([API.getProducts(), API.getWarehouses()]);
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [el('h2', {}, `${typeLabel} کالا`)]));

    const card = el('div', { className: 'card' });
    card.innerHTML = `
      <form id="doc-form">
        <div class="form-row">
          <div class="form-group">
            <label>تاریخ *</label>
            <input type="date" id="df-date" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="form-group">
            <label>انبار *</label>
            <select id="df-warehouse" class="form-control" required>
              ${warehouses.data.filter(w=>w.isActive).map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>توضیحات</label>
          <textarea id="df-desc" class="form-control" rows="2"></textarea>
        </div>
        <h4 style="margin:1rem 0 0.5rem">اقلام سند</h4>
        <div id="doc-items">
          <table class="doc-items-table"><thead><tr><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th></th></tr></thead><tbody id="items-body"></tbody></table>
        </div>
        <div class="add-item-row">
          <div class="form-group">
            <label>کالا</label>
            <select id="add-product" class="form-control">
              <option value="">انتخاب کالا...</option>
              ${products.data.filter(p=>p.isActive).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.code)})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>تعداد</label>
            <input type="number" id="add-qty" class="form-control" min="0.01" step="0.01" value="1">
          </div>
          <div class="form-group">
            <label>قیمت واحد</label>
            <input type="number" id="add-price" class="form-control" min="0" step="0.01" value="">
          </div>
          <button type="button" class="btn btn-success" onclick="addDocItem()">+ افزودن</button>
        </div>
        <div style="margin-top:1.5rem">
          <button type="submit" class="btn btn-primary">ثبت سند ${typeLabel}</button>
        </div>
      </form>
    `;
    container.appendChild(card);

    window._docItems = [];
    window._docType = type;
    window._docProducts = products.data;

    $('#doc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (window._docItems.length === 0) { showToast('حداقل یک قلم اضافه کنید', 'error'); return; }
      try {
        await API.createDocument({
          type,
          date: $('#df-date').value,
          warehouseId: parseInt($('#df-warehouse').value),
          description: $('#df-desc').value || null,
          items: window._docItems,
        });
        showToast('سند با موفقیت ثبت شد');
        window._docItems = [];
        renderDocItemsTable();
      } catch (err) { showToast(err.message, 'error'); }
    });

    renderDocItemsTable();
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

window.addDocItem = function() {
  const productId = parseInt($('#add-product').value);
  const quantity = parseFloat($('#add-qty').value);
  const unitPrice = parseFloat($('#add-price').value) || null;
  if (!productId || !quantity || quantity <= 0) { showToast('کالا و تعداد را وارد کنید', 'error'); return; }
  window._docItems.push({ productId, quantity, unitPrice });
  $('#add-product').value = '';
  $('#add-qty').value = '1';
  $('#add-price').value = '';
  renderDocItemsTable();
};

function renderDocItemsTable() {
  const tbody = $('#items-body');
  if (!tbody) return;
  if (window._docItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af">قلمی اضافه نشده</td></tr>';
    return;
  }
  tbody.innerHTML = window._docItems.map((item, i) => {
    const prod = window._docProducts.find(p => p.id === item.productId);
    return `<tr><td>${escapeHtml(prod?.name || '-')}</td><td>${formatNum(item.quantity)}</td><td>${item.unitPrice ? formatNum(item.unitPrice) : '-'}</td><td><button class="btn btn-sm btn-danger" onclick="removeDocItem(${i})">حذف</button></td></tr>`;
  }).join('');
}

window.removeDocItem = function(idx) {
  window._docItems.splice(idx, 1);
  renderDocItemsTable();
};

// ============ STOCK ============
async function renderStock(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const [stockRes, whRes] = await Promise.all([API.getStock(), API.getWarehouses()]);
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [el('h2', {}, 'موجودی انبار')]));

    const whSelect = el('select', { className: 'form-control', id: 'stock-wh' }, [
      el('option', { value: '' }, 'همه انبارها'),
      ...whRes.data.map(w => el('option', { value: w.id }, w.name)),
    ]);
    const searchInput = el('input', { className: 'form-control', placeholder: 'جستجو...', type: 'text' });

    const filterBar = el('div', { className: 'filters-bar' }, [
      el('div', { className: 'form-group' }, [el('label', {}, 'انبار'), whSelect]),
      el('div', { className: 'form-group' }, [el('label', {}, 'جستجو'), searchInput]),
    ]);
    container.appendChild(filterBar);

    const loadStock = async () => {
      const params = new URLSearchParams();
      if (whSelect.value) params.set('warehouseId', whSelect.value);
      if (searchInput.value) params.set('search', searchInput.value);
      const res = await API.getStock(`?${params}`);
      renderStockTable(container, res.data);
    };

    whSelect.addEventListener('change', loadStock);
    searchInput.addEventListener('input', loadStock);
    loadStock();
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

function renderStockTable(container, data) {
  let tableEl = container.querySelector('#stock-table');
  if (tableEl) tableEl.remove();

  const card = el('div', { className: 'card', id: 'stock-table' });
  if (data.length === 0) {
    card.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>موجودی‌ای یافت نشد</p></div>';
  } else {
    card.innerHTML = `<div class="table-container"><table><thead><tr><th>کد</th><th>نام</th><th>دسته‌بندی</th><th>واحد</th><th>انبار</th><th>موجودی</th><th>حداقل</th><th>وضعیت</th></tr></thead><tbody>
    ${data.map(s => `<tr>
      <td>${escapeHtml(s.code)}</td><td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.categoryName||'-')}</td><td>${escapeHtml(s.unitName||'-')}</td>
      <td>${escapeHtml(s.warehouseName||'-')}</td>
      <td><strong>${formatNum(s.currentStock)}</strong></td><td>${formatNum(s.minStock)}</td>
      <td><span class="badge ${s.status==='low'?'badge-danger':'badge-success'}">${s.status==='low'?'کم‌موجودی':'نرمال'}</span></td>
    </tr>`).join('')}</tbody></table></div>`;
  }
  container.appendChild(card);
}

// ============ CARD (Product Ledger) ============
async function renderCard(container) {
  container.innerHTML = '';
  container.appendChild(el('div', { className: 'page-header' }, [el('h2', {}, 'کارت کالا / گردش کالا')]));

  try {
    const [products, warehouses] = await Promise.all([API.getProducts(), API.getWarehouses()]);

    const prodSelect = el('select', { className: 'form-control', id: 'card-product' }, [
      el('option', { value: '' }, 'انتخاب کالا...'),
      ...products.data.map(p => el('option', { value: p.id }, `${p.name} (${p.code})`)),
    ]);
    const whSelect = el('select', { className: 'form-control', id: 'card-wh' }, [
      el('option', { value: '' }, 'همه انبارها'),
      ...warehouses.data.map(w => el('option', { value: w.id }, w.name)),
    ]);

    container.appendChild(el('div', { className: 'filters-bar' }, [
      el('div', { className: 'form-group' }, [el('label', {}, 'کالا'), prodSelect]),
      el('div', { className: 'form-group' }, [el('label', {}, 'انبار'), whSelect]),
      el('div', { className: 'form-group' }, [el('button', { className: 'btn btn-primary', onClick: loadLedger }, 'نمایش گردش')]),
    ]));

    const resultDiv = el('div', { id: 'ledger-result' });
    container.appendChild(resultDiv);

    async function loadLedger() {
      const productId = prodSelect.value;
      if (!productId) { showToast('کالا را انتخاب کنید', 'error'); return; }
      resultDiv.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
      try {
        const params = whSelect.value ? `?warehouseId=${whSelect.value}` : '';
        const { data } = await API.getLedger(productId, params);
        const product = products.data.find(p => p.id == productId);

        if (data.length === 0) {
          resultDiv.innerHTML = '<div class="card"><div class="empty-state"><p>گردشی برای این کالا ثبت نشده</p></div></div>';
          return;
        }

        resultDiv.innerHTML = `<div class="card"><div class="card-header"><span class="card-title">گردش: ${escapeHtml(product?.name || '')}</span></div>
        <div class="table-container"><table><thead><tr><th>تاریخ</th><th>شماره سند</th><th>نوع</th><th>ورود</th><th>خروج</th><th>مانده</th><th>ثبت‌کننده</th><th>انبار</th></tr></thead><tbody>
        ${data.map(d => `<tr>
          <td>${formatDate(d.date)}</td><td>${escapeHtml(d.documentNumber)}</td>
          <td><span class="badge badge-${d.type==='IN'?'success':d.type==='OUT'?'danger':'info'}">${DOC_TYPE_LABELS[d.type]}</span></td>
          <td>${d.inQty ? formatNum(d.inQty) : '-'}</td>
          <td>${d.outQty ? formatNum(d.outQty) : '-'}</td>
          <td><strong>${formatNum(d.balance)}</strong></td>
          <td>${escapeHtml(d.creatorName||'-')}</td><td>${escapeHtml(d.warehouseName||'-')}</td>
        </tr>`).join('')}</tbody></table></div></div>`;
      } catch (err) { resultDiv.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
    }
  } catch (err) { container.innerHTML += `<div class="alert alert-error">${err.message}</div>`; }
}

// ============ REPORTS ============
async function renderReports(container) {
  container.innerHTML = '';
  container.appendChild(el('div', { className: 'page-header' }, [el('h2', {}, 'گزارش‌ها')]));

  try {
    const [products, warehouses] = await Promise.all([API.getProducts(), API.getWarehouses()]);

    // Report type tabs
    const tabs = el('div', { className: 'card' }, [
      el('div', { style: 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem' }, [
        el('button', { className: 'btn btn-primary', id: 'tab-stock', onClick: () => showReport('stock') }, 'موجودی فعلی'),
        el('button', { className: 'btn btn-outline', id: 'tab-low', onClick: () => showReport('low') }, 'کم‌موجودی'),
        el('button', { className: 'btn btn-outline', id: 'tab-in', onClick: () => showReport('in') }, 'ورود کالاها'),
        el('button', { className: 'btn btn-outline', id: 'tab-out', onClick: () => showReport('out') }, 'خروج کالاها'),
      ]),
      el('div', { id: 'report-filters' }),
      el('div', { id: 'report-result' }),
    ]);
    container.appendChild(tabs);

    async function showReport(type) {
      $$('#report-filters').forEach(e => e.innerHTML = '');
      const filtersEl = $('#report-filters');

      const whSelect = el('select', { className: 'form-control', id: 'rpt-wh' }, [
        el('option', { value: '' }, 'همه انبارها'),
        ...warehouses.data.map(w => el('option', { value: w.id }, w.name)),
      ]);

      if (type === 'stock' || type === 'low') {
        filtersEl.appendChild(el('div', { className: 'filters-bar' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'انبار'), whSelect]),
          el('div', { className: 'form-group' }, [el('button', { className: 'btn btn-primary', onClick: () => loadStockReport(type) }, 'اعمال فیلتر')]),
        ]));
        loadStockReport(type);
      } else {
        const prodSelect = el('select', { className: 'form-control', id: 'rpt-product' }, [
          el('option', { value: '' }, 'همه کالاها'),
          ...products.data.map(p => el('option', { value: p.id }, p.name)),
        ]);
        const fromDate = el('input', { type: 'date', className: 'form-control', id: 'rpt-from' });
        const toDate = el('input', { type: 'date', className: 'form-control', id: 'rpt-to' });

        filtersEl.appendChild(el('div', { className: 'filters-bar' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'کالا'), prodSelect]),
          el('div', { className: 'form-group' }, [el('label', {}, 'انبار'), whSelect]),
          el('div', { className: 'form-group' }, [el('label', {}, 'از تاریخ'), fromDate]),
          el('div', { className: 'form-group' }, [el('label', {}, 'تا تاریخ'), toDate]),
          el('div', { className: 'form-group' }, [el('button', { className: 'btn btn-primary', onClick: () => loadMovementsReport(type) }, 'اعمال فیلتر')]),
        ]));
        loadMovementsReport(type);
      }
    }

    async function loadStockReport(type) {
      const resultEl = $('#report-result');
      resultEl.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
      try {
        const params = new URLSearchParams();
        const wh = $('#rpt-wh')?.value;
        if (wh) params.set('warehouseId', wh);
        if (type === 'low') params.set('lowStockOnly', 'true');
        const { data } = await API.getStockReport(`?${params}`);
        resultEl.innerHTML = `<div class="table-container"><table><thead><tr><th>کد</th><th>نام</th><th>دسته‌بندی</th><th>واحد</th><th>انبار</th><th>موجودی</th><th>حداقل</th><th>وضعیت</th></tr></thead><tbody>
        ${data.map(s => `<tr><td>${escapeHtml(s.code)}</td><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.categoryName||'-')}</td><td>${escapeHtml(s.unitName||'-')}</td><td>${escapeHtml(s.warehouseName||'-')}</td><td>${formatNum(s.currentStock)}</td><td>${formatNum(s.minStock)}</td><td><span class="badge ${s.currentStock<=s.minStock?'badge-danger':'badge-success'}">${s.currentStock<=s.minStock?'کم‌موجودی':'نرمال'}</span></td></tr>`).join('')}</tbody></table></div>`;
      } catch (err) { resultEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
    }

    async function loadMovementsReport(type) {
      const resultEl = $('#report-result');
      resultEl.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
      try {
        const params = new URLSearchParams();
        params.set('type', type === 'in' ? 'IN' : 'OUT');
        const wh = $('#rpt-wh')?.value;
        const prod = $('#rpt-product')?.value;
        const from = $('#rpt-from')?.value;
        const to = $('#rpt-to')?.value;
        if (wh) params.set('warehouseId', wh);
        if (prod) params.set('productId', prod);
        if (from) params.set('fromDate', from);
        if (to) params.set('toDate', to);
        const { data } = await API.getMovementsReport(`?${params}`);
        resultEl.innerHTML = `<div class="table-container"><table><thead><tr><th>تاریخ</th><th>شماره</th><th>کالا</th><th>تعداد</th><th>انبار</th><th>ثبت‌کننده</th></tr></thead><tbody>
        ${data.map(d => `<tr><td>${formatDate(d.date)}</td><td>${escapeHtml(d.documentNumber)}</td><td>${escapeHtml(d.productName||'-')}</td><td>${formatNum(d.quantity)}</td><td>${escapeHtml(d.warehouseName||'-')}</td><td>${escapeHtml(d.creatorName||'-')}</td></tr>`).join('')}</tbody></table></div>`;
      } catch (err) { resultEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
    }

    showReport('stock');
  } catch (err) { container.innerHTML += `<div class="alert alert-error">${err.message}</div>`; }
}

// ============ USERS (Admin) ============
async function renderUsers(container) {
  container.innerHTML = '<div class="loading">در حال بارگذاری...</div>';
  try {
    const { data } = await API.getUsers();
    container.innerHTML = '';
    container.appendChild(el('div', { className: 'page-header' }, [
      el('h2', {}, 'مدیریت کاربران'),
      el('button', { className: 'btn btn-primary', onClick: () => showUserModal(null, () => renderUsers(container)) }, '+ کاربر جدید'),
    ]));

    const card = el('div', { className: 'card' });
    card.innerHTML = `<div class="table-container"><table><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>
    ${data.map(u => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.role==='admin'?'badge-info':'badge-success'}">${u.role==='admin'?'مدیر':'کاربر'}</span></td>
      <td><span class="badge ${u.banned?'badge-danger':'badge-success'}">${u.banned?'مسدود':'فعال'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editUser('${u.id}')">ویرایش</button>
        ${u.banned
          ? `<button class="btn btn-sm btn-success" onclick="unbanUser('${u.id}')">رفع مسدودیت</button>`
          : `<button class="btn btn-sm btn-warning" onclick="banUser('${u.id}')">مسدود</button>`
        }
        <button class="btn btn-sm btn-outline" onclick="revokeSessions('${u.id}')">لغو جلسات</button>
      </td></tr>`).join('')}</tbody></table></div>`;
    container.appendChild(card);
    window._refreshUsers = () => renderUsers(container);
  } catch (err) { container.innerHTML = `<div class="alert alert-error">${err.message}</div>`; }
}

window.editUser = function(id) {
  API.getUsers().then(({ data }) => {
    const user = data.find(u => u.id === id);
    showUserModal(user, window._refreshUsers);
  });
};

window.banUser = async function(id) {
  const reason = prompt('دلیل مسدودیت:') || 'توسط مدیر';
  try { await API.banUser(id, reason); showToast('کاربر مسدود شد'); window._refreshUsers(); }
  catch (err) { showToast(err.message, 'error'); }
};

window.unbanUser = async function(id) {
  try { await API.unbanUser(id); showToast('مسدودیت رفع شد'); window._refreshUsers(); }
  catch (err) { showToast(err.message, 'error'); }
};

window.revokeSessions = async function(id) {
  if (!confirm('تمام جلسات این کاربر لغو شود؟')) return;
  try { await API.revokeUserSessions(id); showToast('جلسات لغو شد'); }
  catch (err) { showToast(err.message, 'error'); }
};

function showUserModal(user, onSave) {
  const isEdit = !!user;
  const overlay = el('div', { className: 'modal-overlay', onClick: (e) => { if (e.target === overlay) overlay.remove(); } });
  overlay.appendChild(el('div', { className: 'modal' }, [
    el('div', { className: 'modal-header' }, [
      el('h3', {}, isEdit ? 'ویرایش کاربر' : 'کاربر جدید'),
      el('button', { className: 'modal-close', onClick: () => overlay.remove() }, '×'),
    ]),
    el('form', { onSubmit: async (e) => {
      e.preventDefault();
      try {
        if (isEdit) {
          await API.updateUser(user.id, {
            name: $('#uf-name').value,
            email: $('#uf-email').value,
            role: $('#uf-role').value,
          });
          const newPass = $('#uf-password').value;
          if (newPass) await API.setUserPassword(user.id, newPass);
        } else {
          await API.createUser({
            name: $('#uf-name').value,
            email: $('#uf-email').value,
            password: $('#uf-password').value,
            role: $('#uf-role').value,
          });
        }
        showToast(isEdit ? 'ویرایش شد' : 'کاربر ایجاد شد');
        overlay.remove(); onSave();
      } catch (err) { showToast(err.message, 'error'); }
    }}, [
      el('div', { className: 'modal-body' }, [
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'نام *'), el('input', { id: 'uf-name', className: 'form-control', required: '', value: user?.name || '' })]),
          el('div', { className: 'form-group' }, [el('label', {}, 'ایمیل *'), el('input', { id: 'uf-email', type: 'email', className: 'form-control', required: '', value: user?.email || '' })]),
        ]),
        el('div', { className: 'form-row' }, [
          el('div', { className: 'form-group' }, [el('label', {}, 'نقش'), el('select', { id: 'uf-role', className: 'form-control' }, [
            el('option', { value: 'user', selected: user?.role !== 'admin' ? '' : undefined }, 'کاربر'),
            el('option', { value: 'admin', selected: user?.role === 'admin' ? '' : undefined }, 'مدیر'),
          ])]),
          el('div', { className: 'form-group' }, [el('label', {}, isEdit ? 'رمز جدید (اختیاری)' : 'رمز عبور *'), el('input', { id: 'uf-password', type: 'password', className: 'form-control', required: !isEdit ? '' : undefined, minLength: '8' })]),
        ]),
      ]),
      el('div', { className: 'modal-footer' }, [
        el('button', { type: 'submit', className: 'btn btn-primary' }, 'ذخیره'),
        el('button', { type: 'button', className: 'btn btn-outline', onClick: () => overlay.remove() }, 'انصراف'),
      ]),
    ]),
  ]));
  document.body.appendChild(overlay);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) window.location.hash = '#/login';
  render();
});
