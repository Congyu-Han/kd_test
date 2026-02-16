(function () {
  const API_BASE = window.__API_BASE__ || '';

  const state = {
    token: localStorage.getItem('kds_token') || '',
    me: null,
    menu: [],
    activeRoute: 'providers',
    activeDepartmentId: '',
    pagerByRoute: {},
    filtersByRoute: {}
  };

  const loginView = document.getElementById('login-view');
  const appShell = document.getElementById('app-shell');
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const menuTree = document.getElementById('menu-tree');
  const pageRoot = document.getElementById('page-root');
  const toolbarTitle = document.getElementById('toolbar-title');
  const topContact = document.getElementById('top-contact');
  const topUser = document.getElementById('top-user');
  const topCompany = document.getElementById('top-company');
  const globalMsg = document.getElementById('global-msg');
  const refreshBtn = document.getElementById('toolbar-refresh');
  const logoutBtn = document.getElementById('toolbar-logout');

  topContact.textContent = '17721327559';
  topCompany.textContent = '| 山西诚鼎伟业科技有限责任公司--总代理';

  const GENERIC_ROUTES = {
    'sales.orders': {
      title: '售课订单',
      endpoint: '/api/v1/sales/orders',
      columns: [
        { label: '订单号', key: 'orderNo' },
        { label: '客户', key: 'customer' },
        { label: '金额', key: 'amount' },
        { label: '状态', key: 'status' },
        { label: '创建时间', key: 'createdAt' }
      ]
    },
    'sales.monthly': {
      title: '月度统计',
      endpoint: '/api/v1/sales/monthly-stats',
      columns: [
        { label: '月份', key: 'month' },
        { label: '订单数', key: 'orderCount' },
        { label: '交易金额', key: 'amount' },
        { label: '收益金额', key: 'income' }
      ]
    },
    'sales.offline': {
      title: '线下课时订单管理',
      endpoint: '/api/v1/sales/offline-orders',
      columns: [
        { label: '订单号', key: 'orderNo' },
        { label: '企业', key: 'enterprise' },
        { label: '课时', key: 'classHours' },
        { label: '金额', key: 'amount' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'sales.distribution': {
      title: '分配企业课时记录',
      endpoint: '/api/v1/sales/distributions',
      columns: [
        { label: '企业', key: 'enterprise' },
        { label: '服务商', key: 'providerName' },
        { label: '课时', key: 'classHours' },
        { label: '操作人', key: 'operator' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'sales.ledger': {
      title: '两类人员培训销售账单',
      endpoint: '/api/v1/sales/ledgers',
      columns: [
        { label: '账单号', key: 'billNo' },
        { label: '客户类型', key: 'customerType' },
        { label: '客户名称', key: 'customerName' },
        { label: '金额', key: 'amount' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'quota.purchase': {
      title: '购买课时',
      endpoint: '/api/v1/quota/purchases',
      createEndpoint: '/api/v1/quota/purchases',
      columns: [
        { label: '服务商', key: 'providerName' },
        { label: '课时', key: 'classHours' },
        { label: '金额', key: 'amount' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'quota.records': {
      title: '购买记录',
      endpoint: '/api/v1/quota/records',
      columns: [
        { label: '服务商', key: 'providerName' },
        { label: '动作', key: 'action' },
        { label: '课时', key: 'classHours' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'coupon.config': {
      title: '培训券定价',
      endpoint: '/api/v1/coupon/configs',
      createEndpoint: '/api/v1/coupon/configs',
      columns: [
        { label: '券类型', key: 'couponType' },
        { label: '面值', key: 'faceValue' },
        { label: '售价', key: 'price' },
        { label: '状态', key: 'status' }
      ]
    },
    'coupon.dispatch': {
      title: '派券记录',
      endpoint: '/api/v1/coupon/dispatches',
      createEndpoint: '/api/v1/coupon/dispatches',
      columns: [
        { label: '券类型', key: 'couponType' },
        { label: '接收方', key: 'receiver' },
        { label: '数量', key: 'quantity' },
        { label: '操作人', key: 'operator' },
        { label: '时间', key: 'createdAt' }
      ]
    },
    'system.accounts': {
      title: '收款账户管理',
      endpoint: '/api/v1/system/payment-accounts',
      createEndpoint: '/api/v1/system/payment-accounts',
      columns: [
        { label: '账户名称', key: 'accountName' },
        { label: '账号', key: 'accountNo' },
        { label: '开户行', key: 'bankName' },
        { label: '状态', key: 'status' }
      ]
    },
    'system.users': {
      title: '用户管理',
      endpoint: '/api/v1/system/users',
      createEndpoint: '/api/v1/system/users',
      columns: [
        { label: '姓名', key: 'name' },
        { label: '账号', key: 'username' },
        { label: '角色', key: 'roleName' },
        { label: '部门', key: 'departmentName' },
        { label: '状态', key: 'status' }
      ]
    },
    'system.permissions': {
      title: '权限管理',
      endpoint: '/api/v1/system/roles',
      createEndpoint: '/api/v1/system/roles',
      columns: [
        { label: '角色ID', key: 'id' },
        { label: '角色名', key: 'name' },
        { label: '权限点', render: (item) => (item.permissions || []).join(', ') || '-' }
      ]
    }
  };

  function setGlobalMessage(message, isError) {
    if (!message) {
      globalMsg.textContent = '';
      globalMsg.className = '';
      return;
    }
    globalMsg.textContent = message;
    globalMsg.className = 'show';
    globalMsg.style.background = isError ? '#d45736' : '#3a9158';
    setTimeout(() => {
      globalMsg.className = '';
    }, 2200);
  }

  function setLoginMessage(message) {
    loginMsg.textContent = message || '';
  }

  function showLogin() {
    loginView.style.display = 'grid';
    appShell.classList.remove('show');
  }

  function showApp() {
    loginView.style.display = 'none';
    appShell.classList.add('show');
  }

  function getPager(route) {
    if (!state.pagerByRoute[route]) {
      state.pagerByRoute[route] = { page: 1, pageSize: 10, total: 0 };
    }
    return state.pagerByRoute[route];
  }

  function buildQuery(params) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value === undefined || value === null || value === '') return;
      query.set(key, String(value));
    });
    return query.toString();
  }

  async function request(path, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (state.token) {
      headers.Authorization = 'Bearer ' + state.token;
    }

    const response = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || payload.code || '请求失败');
      }
      return payload.data;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || '请求失败');
    }
    return text;
  }

  function flattenMenu(menu) {
    const map = {};
    menu.forEach((item) => {
      map[item.key] = item.title;
      (item.children || []).forEach((child) => {
        map[child.key] = child.title;
      });
    });
    return map;
  }

  function getFirstLeaf(menu) {
    for (const item of menu) {
      if (Array.isArray(item.children) && item.children.length) {
        return item.children[0].key;
      }
      return item.key;
    }
    return 'providers';
  }

  function renderMenu() {
    menuTree.innerHTML = '';
    state.menu.forEach((item) => {
      const block = document.createElement('div');
      block.className = 'menu-block';

      if (item.children && item.children.length) {
        const titleBtn = document.createElement('button');
        titleBtn.className = 'menu-title';
        titleBtn.textContent = item.title;
        titleBtn.dataset.key = item.key;
        if (item.children.some((child) => child.key === state.activeRoute)) {
          titleBtn.classList.add('active');
        }
        titleBtn.addEventListener('click', () => {
          goRoute(item.children[0].key);
        });
        block.appendChild(titleBtn);

        const childrenWrap = document.createElement('div');
        childrenWrap.className = 'menu-children';
        item.children.forEach((child) => {
          const childBtn = document.createElement('button');
          childBtn.className = 'menu-item';
          childBtn.textContent = child.title;
          childBtn.dataset.key = child.key;
          if (child.key === state.activeRoute) {
            childBtn.classList.add('active');
          }
          childBtn.addEventListener('click', () => {
            goRoute(child.key);
          });
          childrenWrap.appendChild(childBtn);
        });
        block.appendChild(childrenWrap);
      } else {
        const itemBtn = document.createElement('button');
        itemBtn.className = 'menu-item';
        itemBtn.textContent = item.title;
        itemBtn.dataset.key = item.key;
        if (item.key === state.activeRoute) {
          itemBtn.classList.add('active');
        }
        itemBtn.addEventListener('click', () => {
          goRoute(item.key);
        });
        block.appendChild(itemBtn);
      }

      menuTree.appendChild(block);
    });
  }

  function renderTable(columns, list) {
    const head = columns.map((column) => `<th>${column.label}</th>`).join('');
    const rows = list
      .map((item) => {
        const tds = columns
          .map((column) => {
            const value = typeof column.render === 'function' ? column.render(item) : item[column.key] ?? '-';
            return `<td>${value}</td>`;
          })
          .join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');

    return `
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${rows || `<tr><td colspan="${columns.length}" class="empty">抱歉，无相关数据。</td></tr>`}</tbody>
      </table>
    `;
  }

  function renderPager(route) {
    const pager = getPager(route);
    const maxPage = Math.max(1, Math.ceil((pager.total || 0) / pager.pageSize));
    return `
      <div class="pager">
        <span>共 ${pager.total || 0} 条</span>
        <button data-pager="prev">上一页</button>
        <span>${pager.page} / ${maxPage}</span>
        <button data-pager="next">下一页</button>
      </div>
    `;
  }

  function mountPager(route, onChange) {
    pageRoot.querySelectorAll('[data-pager]').forEach((button) => {
      button.addEventListener('click', () => {
        const pager = getPager(route);
        const maxPage = Math.max(1, Math.ceil((pager.total || 0) / pager.pageSize));
        if (button.dataset.pager === 'prev') {
          pager.page = Math.max(1, pager.page - 1);
        } else {
          pager.page = Math.min(maxPage, pager.page + 1);
        }
        onChange();
      });
    });
  }

  function promptText(label, fallback) {
    const value = window.prompt(label, fallback || '');
    if (value === null) return null;
    return value.trim();
  }

  async function renderProvidersPage() {
    const route = 'providers';
    const pager = getPager(route);
    const filters = state.filtersByRoute[route] || { keyword: '', area: '', type: '' };
    state.filtersByRoute[route] = filters;

    const query = buildQuery({
      page: pager.page,
      pageSize: pager.pageSize,
      keyword: filters.keyword,
      area: filters.area,
      type: filters.type
    });
    const data = await request(`/api/v1/providers?${query}`);
    pager.total = data.total;

    const areaOptions = Array.from(new Set(data.list.map((item) => item.area))).filter(Boolean);

    const rows = data.list
      .map(
        (item) => `
          <tr>
            <td>${item.serviceProviderName}</td>
            <td>${item.serviceProviderType}</td>
            <td>${item.area}</td>
            <td>${item.principal}</td>
            <td>${item.phone}</td>
            <td>${item.enterpriseCount}</td>
            <td>${item.userCount}</td>
            <td>${item.pricing}</td>
            <td>${item.classBalance}</td>
            <td><button class="action-link" data-account="${item.id}">账户</button></td>
            <td>
              <button class="action-link" data-status="${item.id}" data-current-status="${item.status}">
                ${item.status === 'enabled' ? '禁用' : '启用'}
              </button>
            </td>
          </tr>
        `
      )
      .join('');

    pageRoot.innerHTML = `
      <div class="block">
        <div class="filter-row">
          <input id="providers-keyword" placeholder="搜索服务商" value="${filters.keyword || ''}" />
          <select id="providers-area">
            <option value="">请选择</option>
            ${areaOptions.map((item) => `<option value="${item}" ${filters.area === item ? 'selected' : ''}>${item}</option>`).join('')}
          </select>
          <select id="providers-type">
            <option value="">服务商类型</option>
            <option value="服务商" ${filters.type === '服务商' ? 'selected' : ''}>服务商</option>
          </select>
          <button class="btn" id="providers-query">查询</button>
          <button class="btn" id="providers-reset">重置</button>
          <button class="btn primary" id="providers-create">新增服务商</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>服务商名称</th><th>服务商类型</th><th>销售区域</th><th>负责人</th><th>联系方式</th>
              <th>下属企业数</th><th>用户数</th><th>定价</th><th>课时余额</th><th>账户管理</th><th>操作</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="11" class="empty">抱歉，无相关数据。</td></tr>'}</tbody>
        </table>
        ${renderPager(route)}
      </div>
    `;

    document.getElementById('providers-query').addEventListener('click', () => {
      filters.keyword = document.getElementById('providers-keyword').value.trim();
      filters.area = document.getElementById('providers-area').value;
      filters.type = document.getElementById('providers-type').value;
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('providers-reset').addEventListener('click', () => {
      filters.keyword = '';
      filters.area = '';
      filters.type = '';
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('providers-create').addEventListener('click', async () => {
      const serviceProviderName = promptText('服务商名称', '');
      if (!serviceProviderName) return;
      const area = promptText('销售区域', '晋城市') || '晋城市';
      const principal = promptText('负责人', '负责人') || '负责人';
      const phone = promptText('联系方式', '13800000000') || '13800000000';
      try {
        await request('/api/v1/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceProviderName, serviceProviderType: '服务商', area, principal, phone })
        });
        setGlobalMessage('新增服务商成功');
        renderActiveRoute();
      } catch (error) {
        setGlobalMessage(error.message, true);
      }
    });

    pageRoot.querySelectorAll('[data-status]').forEach((button) => {
      button.addEventListener('click', async () => {
        const providerId = button.dataset.status;
        const nextStatus = button.dataset.currentStatus === 'enabled' ? 'disabled' : 'enabled';
        try {
          await request(`/api/v1/providers/${providerId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
          });
          setGlobalMessage('状态更新成功');
          renderActiveRoute();
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    });

    pageRoot.querySelectorAll('[data-account]').forEach((button) => {
      button.addEventListener('click', async () => {
        const providerId = button.dataset.account;
        try {
          const accountData = await request(`/api/v1/providers/${providerId}/accounts?page=1&pageSize=20`);
          window.alert(`账户数量：${accountData.total}`);
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    });

    mountPager(route, renderActiveRoute);
  }

  async function renderWalletPage() {
    const route = 'sales.wallet';
    const pager = getPager(route);
    const filters = state.filtersByRoute[route] || { keyword: '' };
    state.filtersByRoute[route] = filters;

    const summary = await request('/api/v1/sales/wallet/summary');
    const query = buildQuery({ page: pager.page, pageSize: pager.pageSize, keyword: filters.keyword });
    const data = await request(`/api/v1/sales/wallet/transactions?${query}`);
    pager.total = data.total;

    const rows = data.list
      .map(
        (item) => `
          <tr>
            <td>${item.transactionTime}</td>
            <td>${item.transactionType}</td>
            <td>${item.target}</td>
            <td>${item.targetType}</td>
            <td>${item.classHours}</td>
            <td>${item.transactionAmount}</td>
            <td>${item.incomeAmount}</td>
            <td>${item.orderNo}</td>
            <td>${item.remark || '-'}</td>
          </tr>
        `
      )
      .join('');

    pageRoot.innerHTML = `
      <div class="block wallet-card">💰 累计收益（元）<strong>${summary.totalIncome || 0}</strong></div>
      <div class="block">
        <div class="filter-row">
          <span>查询时间：</span>
          <input id="wallet-keyword" placeholder="交易对象/订单号" value="${filters.keyword || ''}" style="min-width:320px;" />
          <button class="action-link" data-quick-range="month">本月</button>
          <button class="action-link" data-quick-range="last-month">上月</button>
          <button class="action-link" data-quick-range="quarter">上一季</button>
          <button class="action-link" data-quick-range="year">今年</button>
          <div style="margin-left:auto;display:flex;gap:8px;">
            <button class="btn primary" id="wallet-export">导出</button>
            <button class="btn" id="wallet-query">查询</button>
            <button class="btn" id="wallet-reset">重置</button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>交易时间</th><th>交易类型</th><th>交易对象</th><th>对象类型</th><th>交易课时数</th>
              <th>交易金额（元）</th><th>收益金额（元）</th><th>订单号</th><th>备注</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="9" class="empty">抱歉，无相关数据。</td></tr>'}</tbody>
        </table>
        ${renderPager(route)}
      </div>
    `;

    document.getElementById('wallet-query').addEventListener('click', () => {
      filters.keyword = document.getElementById('wallet-keyword').value.trim();
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('wallet-reset').addEventListener('click', () => {
      filters.keyword = '';
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('wallet-export').addEventListener('click', async () => {
      try {
        const csv = await request('/api/v1/export/wallet');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wallet-export.csv';
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        setGlobalMessage(error.message, true);
      }
    });

    pageRoot.querySelectorAll('[data-quick-range]').forEach((button) => {
      button.addEventListener('click', () => {
        setGlobalMessage(`已切换到${button.textContent}，当前为演示查询`);
      });
    });

    mountPager(route, renderActiveRoute);
  }

  async function renderDepartmentsPage() {
    const route = 'system.departments';
    const filters = state.filtersByRoute[route] || { keyword: '' };
    state.filtersByRoute[route] = filters;

    const departmentsData = await request(`/api/v1/system/departments?page=1&pageSize=200&keyword=${encodeURIComponent(filters.keyword || '')}`);
    const usersData = await request('/api/v1/system/users?page=1&pageSize=200');

    const departments = departmentsData.list;
    const users = usersData.list;

    if (!state.activeDepartmentId && departments.length > 0) {
      state.activeDepartmentId = departments[0].id;
    }

    const departmentRows = departments
      .map((dep) => {
        const active = dep.id === state.activeDepartmentId ? ' style="background:#eef2fa;"' : '';
        return `
          <div class="tree-row"${active}>
            <div>
              <button class="action-link" data-select-dep="${dep.id}">${dep.name}</button>
            </div>
            <div>
              <button class="action-link" data-add-child="${dep.id}">新增子部门</button>
              <button class="action-link" data-rename-dep="${dep.id}">重命名</button>
            </div>
          </div>
        `;
      })
      .join('');

    const members = users.filter((item) => item.departmentId === state.activeDepartmentId);

    pageRoot.innerHTML = `
      <div class="split">
        <div class="block">
          <div class="filter-row">
            <input id="dep-keyword" placeholder="搜索部门" value="${filters.keyword || ''}" />
            <button class="btn" id="dep-query">查询</button>
            <button class="btn" id="dep-reset">重置</button>
            <button class="btn primary" id="dep-create-root">新增部门</button>
          </div>
          ${departmentRows || '<div class="empty">抱歉，无相关数据。</div>'}
        </div>
        <div class="block">
          <div style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px;">所属成员</div>
          ${
            members.length
              ? renderTable(
                  [
                    { label: '姓名', key: 'name' },
                    { label: '账号', key: 'username' },
                    { label: '角色', key: 'roleName' }
                  ],
                  members
                )
              : '<div class="empty" style="padding-top:80px;">无所属成员</div>'
          }
        </div>
      </div>
    `;

    document.getElementById('dep-query').addEventListener('click', () => {
      filters.keyword = document.getElementById('dep-keyword').value.trim();
      renderActiveRoute();
    });

    document.getElementById('dep-reset').addEventListener('click', () => {
      filters.keyword = '';
      renderActiveRoute();
    });

    document.getElementById('dep-create-root').addEventListener('click', async () => {
      const name = promptText('部门名称', '新部门');
      if (!name) return;
      try {
        await request('/api/v1/system/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parentId: null })
        });
        setGlobalMessage('新增部门成功');
        renderActiveRoute();
      } catch (error) {
        setGlobalMessage(error.message, true);
      }
    });

    pageRoot.querySelectorAll('[data-select-dep]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeDepartmentId = button.dataset.selectDep;
        renderActiveRoute();
      });
    });

    pageRoot.querySelectorAll('[data-add-child]').forEach((button) => {
      button.addEventListener('click', async () => {
        const parentId = button.dataset.addChild;
        const name = promptText('子部门名称', '新子部门');
        if (!name) return;
        try {
          await request('/api/v1/system/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, parentId })
          });
          setGlobalMessage('新增子部门成功');
          renderActiveRoute();
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    });

    pageRoot.querySelectorAll('[data-rename-dep]').forEach((button) => {
      button.addEventListener('click', async () => {
        const departmentId = button.dataset.renameDep;
        const nextName = promptText('新的部门名称', '');
        if (!nextName) return;
        try {
          await request(`/api/v1/system/departments/${departmentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nextName })
          });
          setGlobalMessage('部门更新成功');
          renderActiveRoute();
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    });
  }

  async function renderCoursewarePage() {
    const route = 'courseware';
    const pager = getPager(route);
    const filters = state.filtersByRoute[route] || {
      keyword: '',
      industry: '',
      tag: '',
      source: '',
      onlyTest: false
    };
    state.filtersByRoute[route] = filters;

    const query = buildQuery({
      page: pager.page,
      pageSize: pager.pageSize,
      keyword: filters.keyword,
      industry: filters.industry,
      tag: filters.tag,
      source: filters.source,
      onlyTest: filters.onlyTest ? 1 : ''
    });

    const data = await request(`/api/v1/courseware?${query}`);
    pager.total = data.total;

    const rows = data.list
      .map(
        (item) => `
          <tr>
            <td>${item.title}</td>
            <td>👍${item.upVotes} 💬${item.comments} 👎${item.downVotes}</td>
            <td>${item.duration}</td>
            <td>${item.updatedAt}</td>
            <td>${item.status}</td>
            <td><button class="action-link" data-course-view="${item.id}">查看</button></td>
          </tr>
        `
      )
      .join('');

    pageRoot.innerHTML = `
      <div class="block">
        <div class="filter-row">
          <input id="course-keyword" placeholder="请输入标题" value="${filters.keyword || ''}" style="min-width:300px;" />
          <button class="btn primary" id="course-create">+新建</button>
          <button class="btn">大纲模式</button>
          <button class="btn primary">标签模式</button>
        </div>
        <div class="filter-row" style="background:#f8f9fc;padding:8px;">
          <strong>筛选条件</strong>
          <select id="course-industry">
            <option value="">所属行业</option>
            <option value="交通运输" ${filters.industry === '交通运输' ? 'selected' : ''}>交通运输</option>
          </select>
          <select id="course-tag">
            <option value="">标签</option>
            <option value="交通执法" ${filters.tag === '交通执法' ? 'selected' : ''}>交通执法</option>
            <option value="校车" ${filters.tag === '校车' ? 'selected' : ''}>校车</option>
            <option value="防御性驾驶" ${filters.tag === '防御性驾驶' ? 'selected' : ''}>防御性驾驶</option>
          </select>
          <select id="course-source">
            <option value="">来源</option>
            <option value="系统课件" ${filters.source === '系统课件' ? 'selected' : ''}>系统课件</option>
            <option value="企业课件" ${filters.source === '企业课件' ? 'selected' : ''}>企业课件</option>
          </select>
          <label style="margin-left:auto;display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="course-only-test" ${filters.onlyTest ? 'checked' : ''} />
            仅显示测试
          </label>
          <button class="btn" id="course-query">查询</button>
          <button class="btn" id="course-reset">重置</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>标题</th><th>课程互动</th><th>时长</th><th>最新编辑时间</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" class="empty">抱歉，无相关数据。</td></tr>'}</tbody>
        </table>
        ${renderPager(route)}
      </div>
    `;

    document.getElementById('course-query').addEventListener('click', () => {
      filters.keyword = document.getElementById('course-keyword').value.trim();
      filters.industry = document.getElementById('course-industry').value;
      filters.tag = document.getElementById('course-tag').value;
      filters.source = document.getElementById('course-source').value;
      filters.onlyTest = document.getElementById('course-only-test').checked;
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('course-reset').addEventListener('click', () => {
      state.filtersByRoute[route] = { keyword: '', industry: '', tag: '', source: '', onlyTest: false };
      pager.page = 1;
      renderActiveRoute();
    });

    document.getElementById('course-create').addEventListener('click', async () => {
      const title = promptText('课件标题', '新课件');
      if (!title) return;
      try {
        await request('/api/v1/courseware', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            industry: '交通运输',
            tag: '交通执法',
            source: '企业课件',
            status: '企业课件',
            isTest: false
          })
        });
        setGlobalMessage('课件创建成功');
        renderActiveRoute();
      } catch (error) {
        setGlobalMessage(error.message, true);
      }
    });

    pageRoot.querySelectorAll('[data-course-view]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          const detail = await request(`/api/v1/courseware/${button.dataset.courseView}`);
          window.alert(`课件：${detail.title}\n状态：${detail.status}`);
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    });

    mountPager(route, renderActiveRoute);
  }

  async function renderGenericRoute(route) {
    const config = GENERIC_ROUTES[route];
    if (!config) {
      pageRoot.innerHTML = '<div class="block"><div class="empty">模块开发中</div></div>';
      return;
    }

    const pager = getPager(route);
    const query = buildQuery({ page: pager.page, pageSize: pager.pageSize });
    const data = await request(`${config.endpoint}?${query}`);
    pager.total = data.total;

    pageRoot.innerHTML = `
      <div class="block">
        <div class="filter-row">
          <button class="btn" id="generic-refresh">刷新</button>
          ${config.createEndpoint ? '<button class="btn primary" id="generic-create">新建</button>' : ''}
        </div>
        ${renderTable(config.columns, data.list)}
        ${renderPager(route)}
      </div>
    `;

    const refresh = document.getElementById('generic-refresh');
    if (refresh) {
      refresh.addEventListener('click', renderActiveRoute);
    }

    const create = document.getElementById('generic-create');
    if (create) {
      create.addEventListener('click', async () => {
        try {
          if (route === 'quota.purchase') {
            const providerName = promptText('服务商名称', '安驾课堂晋城分公司');
            const classHours = Number(promptText('购买课时', '10') || '0');
            const amount = Number(promptText('金额', '150') || '0');
            if (!providerName || classHours <= 0 || amount <= 0) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ providerName, classHours, amount })
            });
          } else if (route === 'coupon.config') {
            const couponType = promptText('券类型', '基础培训券');
            const faceValue = Number(promptText('面值', '100') || '0');
            const price = Number(promptText('售价', '95') || '0');
            if (!couponType || faceValue <= 0 || price <= 0) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ couponType, faceValue, price })
            });
          } else if (route === 'coupon.dispatch') {
            const couponType = promptText('券类型', '基础培训券');
            const receiver = promptText('接收方', '安驾课堂晋城分公司');
            const quantity = Number(promptText('数量', '10') || '0');
            if (!couponType || !receiver || quantity <= 0) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ couponType, receiver, quantity })
            });
          } else if (route === 'system.accounts') {
            const accountName = promptText('账户名称', '新收款账户');
            const accountNo = promptText('账号', '6222000011112222');
            const bankName = promptText('开户行', '中国银行太原支行');
            if (!accountName || !accountNo) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accountName, accountNo, bankName })
            });
          } else if (route === 'system.users') {
            const name = promptText('姓名', '新用户');
            const username = promptText('登录账号', 'newuser');
            const password = promptText('登录密码', 'Passw0rd!');
            const roleId = promptText('角色ID', 'role_admin');
            if (!name || !username || !password || !roleId) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, username, password, roleId })
            });
          } else if (route === 'system.permissions') {
            const name = promptText('角色名称', '数据查看员');
            if (!name) return;
            await request(config.createEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, permissions: ['provider.read', 'courseware.read'] })
            });
          }
          setGlobalMessage('新建成功');
          renderActiveRoute();
        } catch (error) {
          setGlobalMessage(error.message, true);
        }
      });
    }

    mountPager(route, renderActiveRoute);
  }

  async function renderActiveRoute() {
    try {
      const titleMap = flattenMenu(state.menu);
      toolbarTitle.textContent = titleMap[state.activeRoute] || '后台管理';

      if (state.activeRoute === 'providers') {
        await renderProvidersPage();
      } else if (state.activeRoute === 'sales.wallet') {
        await renderWalletPage();
      } else if (state.activeRoute === 'system.departments') {
        await renderDepartmentsPage();
      } else if (state.activeRoute === 'courseware') {
        await renderCoursewarePage();
      } else {
        await renderGenericRoute(state.activeRoute);
      }
    } catch (error) {
      setGlobalMessage(error.message || '页面加载失败', true);
    }
  }

  function goRoute(route) {
    state.activeRoute = route;
    renderMenu();
    void renderActiveRoute();
  }

  async function initializeApp() {
    const me = await request('/api/v1/me');
    const menu = await request('/api/v1/menu');

    state.me = me;
    state.menu = menu;
    topUser.textContent = me.username;

    const validKeys = flattenMenu(menu);
    if (!validKeys[state.activeRoute]) {
      state.activeRoute = getFirstLeaf(menu);
    }

    renderMenu();
    await renderActiveRoute();
    showApp();
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    setLoginMessage('登录中...');

    try {
      const data = await request('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      state.token = data.accessToken;
      localStorage.setItem('kds_token', state.token);
      await initializeApp();
      setLoginMessage('');
    } catch (error) {
      setLoginMessage(error.message || '登录失败');
    }
  });

  async function logout() {
    try {
      await request('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    state.token = '';
    localStorage.removeItem('kds_token');
    showLogin();
  }

  refreshBtn.addEventListener('click', () => {
    void renderActiveRoute();
  });

  logoutBtn.addEventListener('click', () => {
    void logout();
  });

  if (state.token) {
    initializeApp().catch(() => {
      localStorage.removeItem('kds_token');
      state.token = '';
      showLogin();
    });
  } else {
    showLogin();
  }
})();
