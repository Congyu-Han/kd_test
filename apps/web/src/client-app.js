(function () {
  const API_BASE = window.__API_BASE__ || '';
  const API_LOGIN = '/api/v1/auth/login';
  const API_ME = '/api/v1/me';
  const API_MENU = '/api/v1/menu';
  const API_DASHBOARD = '/api/v1/dashboard';
  const API_COMPANIES = '/api/v1/companies';
  const API_ORDERS = '/api/v1/orders';

  const state = {
    token: localStorage.getItem('kds_token') || '',
    me: null,
    menu: [],
    route: 'dashboard',
    companies: [],
    orders: [],
    dashboard: null
  };

  const loginView = document.getElementById('login-view');
  const appShell = document.getElementById('app-shell');
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const sidebarMenu = document.getElementById('sidebar-menu');
  const contentView = document.getElementById('content-view');
  const pageTitle = document.getElementById('page-title');
  const userName = document.getElementById('user-name');
  const logoutBtn = document.getElementById('logout-btn');

  function setLoginMessage(message, ok) {
    loginMsg.textContent = message;
    loginMsg.className = ok ? 'msg ok' : 'msg err';
  }

  async function request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const response = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || body.code || 'request_failed');
    return body.data;
  }

  function showLogin() {
    loginView.style.display = 'grid';
    appShell.classList.remove('show');
  }

  function showApp() {
    loginView.style.display = 'none';
    appShell.classList.add('show');
  }

  function renderMenu() {
    sidebarMenu.innerHTML = '';
    state.menu.forEach((item) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = item.title;
      btn.dataset.key = item.key;
      if (item.key === state.route) btn.classList.add('active');
      btn.addEventListener('click', () => {
        state.route = item.key;
        renderMenu();
        renderContent();
      });
      li.appendChild(btn);
      sidebarMenu.appendChild(li);
    });
  }

  function renderDashboard() {
    const d = state.dashboard || { companyCount: 0, orderCount: 0, paidAmount: 0 };
    contentView.innerHTML = `
      <div class="panel">
        <h3>运营概览</h3>
        <div class="stat-grid">
          <div class="stat"><div class="label">企业数量</div><div class="value">${d.companyCount}</div></div>
          <div class="stat"><div class="label">订单数量</div><div class="value">${d.orderCount}</div></div>
          <div class="stat"><div class="label">已支付金额</div><div class="value">¥${d.paidAmount}</div></div>
        </div>
      </div>
    `;
  }

  function renderCompanies() {
    contentView.innerHTML = `
      <div class="panel">
        <h3>企业管理</h3>
        <form id="create-company-form" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <input id="company-name" placeholder="企业名称" style="height:36px;border:1px solid #d9e2ec;border-radius:8px;padding:0 8px;" />
          <input id="company-contact" placeholder="联系人" style="height:36px;border:1px solid #d9e2ec;border-radius:8px;padding:0 8px;" />
          <button class="btn" type="submit">新增企业</button>
        </form>
        <table>
          <thead><tr><th>ID</th><th>企业名称</th><th>联系人</th><th>状态</th></tr></thead>
          <tbody>
            ${state.companies.map((item) => `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.contact}</td><td>${item.status}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    const form = document.getElementById('create-company-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('company-name').value.trim();
      const contact = document.getElementById('company-contact').value.trim();
      if (!name) return;
      await request(API_COMPANIES, { method: 'POST', body: JSON.stringify({ name, contact }) });
      await refreshCompanies();
      renderCompanies();
    });
  }

  function renderOrders() {
    contentView.innerHTML = `
      <div class="panel">
        <h3>订单管理</h3>
        <form id="create-order-form" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
          <select id="order-company" style="height:36px;border:1px solid #d9e2ec;border-radius:8px;padding:0 8px;min-width:180px;">
            ${state.companies.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}
          </select>
          <input id="order-amount" type="number" min="1" placeholder="金额" style="height:36px;border:1px solid #d9e2ec;border-radius:8px;padding:0 8px;" />
          <button class="btn" type="submit">创建订单</button>
        </form>
        <table>
          <thead><tr><th>ID</th><th>企业ID</th><th>金额</th><th>状态</th><th>创建时间</th></tr></thead>
          <tbody>
            ${state.orders.map((item) => `<tr><td>${item.id}</td><td>${item.companyId}</td><td>${item.amount}</td><td>${item.status}</td><td>${item.createdAt}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    const form = document.getElementById('create-order-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const companyId = document.getElementById('order-company').value;
      const amount = Number(document.getElementById('order-amount').value || '0');
      if (!companyId || amount <= 0) return;
      await request(API_ORDERS, { method: 'POST', body: JSON.stringify({ companyId, amount }) });
      await refreshOrders();
      renderOrders();
    });
  }

  function renderUsers() {
    contentView.innerHTML = `
      <div class="panel">
        <h3>用户管理</h3>
        <p style="margin:0;color:#5d697a;">当前登录用户：${state.me ? state.me.name : '-'}</p>
        <p style="margin:8px 0 0;color:#5d697a;">角色：${state.me ? state.me.role : '-'}</p>
      </div>
    `;
  }

  function renderStats() {
    contentView.innerHTML = `
      <div class="panel">
        <h3>统计报表</h3>
        <p style="margin:0;color:#5d697a;">企业数：${state.dashboard?.companyCount || 0}</p>
        <p style="margin:8px 0 0;color:#5d697a;">订单数：${state.dashboard?.orderCount || 0}</p>
        <p style="margin:8px 0 0;color:#5d697a;">已支付金额：¥${state.dashboard?.paidAmount || 0}</p>
      </div>
    `;
  }

  function renderContent() {
    const active = state.menu.find((m) => m.key === state.route);
    pageTitle.textContent = active ? active.title : '后台';
    if (state.route === 'dashboard') return renderDashboard();
    if (state.route === 'companies') return renderCompanies();
    if (state.route === 'orders') return renderOrders();
    if (state.route === 'users') return renderUsers();
    if (state.route === 'stats') return renderStats();
    contentView.innerHTML = '<div class="panel"><p>模块开发中</p></div>';
  }

  async function refreshDashboard() { state.dashboard = await request(API_DASHBOARD); }
  async function refreshCompanies() { state.companies = await request(API_COMPANIES); }
  async function refreshOrders() { state.orders = await request(API_ORDERS); }

  async function initializeApp() {
    state.me = await request(API_ME);
    state.menu = await request(API_MENU);
    userName.textContent = state.me.name;
    if (!state.menu.some((item) => item.key === state.route)) {
      state.route = state.menu[0]?.key || 'dashboard';
    }
    await Promise.all([refreshDashboard(), refreshCompanies(), refreshOrders()]);
    renderMenu();
    renderContent();
    showApp();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    setLoginMessage('登录中...', true);
    try {
      const data = await request(API_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      state.token = data.accessToken;
      localStorage.setItem('kds_token', state.token);
      await initializeApp();
      setLoginMessage('', true);
    } catch (error) {
      setLoginMessage(error.message || '登录失败', false);
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try { await request('/api/v1/auth/logout', { method: 'POST' }); } catch {}
    state.token = '';
    localStorage.removeItem('kds_token');
    showLogin();
  });

  if (state.token) {
    initializeApp().catch(() => {
      state.token = '';
      localStorage.removeItem('kds_token');
      showLogin();
    });
  } else {
    showLogin();
  }
})();
