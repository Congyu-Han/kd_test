import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const clientScript = readFileSync(join(here, 'client-app.js'), 'utf8');

export function buildPage(apiBaseUrl: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>安驾服务商平台</title>
  <style>
    :root {
      --brand: #de6b45;
      --sider: #4a4a4a;
      --sider-hover: #575757;
      --sider-active: #f05a2a;
      --bg: #f2f2f2;
      --panel: #fff;
      --line: #e4e4e4;
      --text: #666;
      --text-heavy: #333;
      --blue: #2a76d1;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    body {
      font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
      color: var(--text-heavy);
      background: var(--bg);
    }
    .login-wrap {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(140deg, #f7f3ef, #f1f1f1);
      padding: 16px;
    }
    .login-card {
      width: 360px;
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 14px 40px rgba(70, 70, 70, 0.15);
      border-radius: 6px;
      padding: 20px;
    }
    .login-card h1 {
      margin: 0 0 6px;
      font-size: 22px;
      color: #3f3f3f;
    }
    .login-card p {
      margin: 0 0 14px;
      color: #888;
      font-size: 13px;
    }
    .field { margin-bottom: 10px; }
    .field input {
      width: 100%;
      height: 40px;
      border: 1px solid #d9d9d9;
      border-radius: 3px;
      padding: 0 10px;
      outline: none;
    }
    .login-btn {
      width: 100%;
      height: 40px;
      border: 0;
      border-radius: 3px;
      background: var(--brand);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    #login-msg {
      min-height: 18px;
      margin-top: 8px;
      font-size: 12px;
      color: #cb4e2d;
    }

    .app-shell { display: none; min-height: 100vh; }
    .app-shell.show { display: block; }

    .top-header {
      height: 48px;
      background: var(--brand);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      font-size: 18px;
      line-height: 1;
    }
    .top-header small {
      font-size: 13px;
      margin-left: 8px;
      opacity: 0.95;
      font-weight: 500;
    }
    .top-header .right {
      font-size: 13px;
      font-weight: 600;
    }

    .app-body {
      display: flex;
      min-height: calc(100vh - 48px);
    }

    #left-nav {
      width: 230px;
      background: var(--sider);
      color: #e8e8e8;
      border-right: 1px solid #5d5d5d;
      overflow-y: auto;
      padding: 12px 0;
    }

    .menu-block { margin-bottom: 2px; }
    .menu-title,
    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      text-align: left;
      height: 54px;
      padding: 0 22px;
      font-size: 14px;
    }
    .menu-title:hover,
    .menu-item:hover { background: var(--sider-hover); }
    .menu-item.active,
    .menu-title.active {
      background: var(--sider-active);
      color: #fff;
      font-weight: 600;
    }
    .menu-children .menu-item {
      height: 42px;
      padding-left: 42px;
      font-size: 14px;
      color: #ddd;
    }

    .main-wrap {
      flex: 1;
      min-width: 0;
      background: #f7f7f7;
      border-left: 1px solid #d8d8d8;
      display: flex;
      flex-direction: column;
    }

    #global-msg {
      height: 0;
      overflow: hidden;
      font-size: 13px;
      color: #fff;
      background: #d45736;
      padding: 0 18px;
      transition: all 0.2s;
    }
    #global-msg.show {
      height: 30px;
      line-height: 30px;
    }

    #main-toolbar {
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      border-bottom: 1px solid #ddd;
      background: #f7f7f7;
      color: #555;
      font-size: 14px;
    }
    #toolbar-title {
      font-size: 16px;
      font-weight: 600;
      color: #4e4e4e;
    }
    .toolbar-actions button {
      border: 1px solid #d3d3d3;
      background: #fff;
      color: #666;
      border-radius: 3px;
      height: 32px;
      margin-left: 8px;
      padding: 0 12px;
      cursor: pointer;
    }
    .toolbar-actions button.primary {
      background: var(--sider-active);
      border-color: var(--sider-active);
      color: #fff;
    }

    #page-root {
      flex: 1;
      padding: 12px 16px;
      overflow: auto;
    }

    .block {
      background: #fff;
      border: 1px solid #e4e4e4;
      margin-bottom: 10px;
      padding: 10px;
    }
    .filter-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .filter-row input,
    .filter-row select {
      height: 34px;
      border: 1px solid #d8d8d8;
      border-radius: 2px;
      padding: 0 10px;
      min-width: 170px;
      background: #fff;
      color: #666;
    }
    .btn {
      height: 34px;
      border: 1px solid #d8d8d8;
      border-radius: 2px;
      padding: 0 12px;
      background: #fff;
      color: #666;
      cursor: pointer;
    }
    .btn.primary {
      background: var(--sider-active);
      border-color: var(--sider-active);
      color: #fff;
    }

    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td {
      border: 1px solid #e5e5e5;
      padding: 10px 8px;
      text-align: left;
      color: #666;
      vertical-align: middle;
      background: #fff;
    }
    th {
      background: #f7f8fb;
      color: #666;
      font-weight: 600;
    }

    .action-link {
      color: #ef6439;
      cursor: pointer;
      font-weight: 600;
      margin-right: 8px;
      border: 0;
      background: transparent;
      padding: 0;
    }

    .empty {
      text-align: center;
      color: #aaa;
      padding: 40px 0;
      font-size: 14px;
    }

    .pager {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      color: #777;
      font-size: 13px;
    }
    .pager button {
      height: 28px;
      border: 1px solid #d8d8d8;
      border-radius: 2px;
      background: #fff;
      padding: 0 10px;
      cursor: pointer;
      color: #666;
    }

    .wallet-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px;
      border-top: 2px solid var(--sider-active);
      color: #8d8d8d;
      font-size: 14px;
    }
    .wallet-card strong { font-size: 38px; color: #1f4b7a; }

    .split {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 12px;
      min-height: 520px;
    }

    .tree-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid #ececec;
      margin-bottom: 8px;
      background: #f8f9fc;
      color: #666;
    }

    @media (max-width: 960px) {
      #left-nav { width: 190px; }
      .split { grid-template-columns: 1fr; }
      .top-header { font-size: 16px; }
      .top-header small { display: none; }
    }
  </style>
</head>
<body>
  <div id="login-view" class="login-wrap">
    <div class="login-card">
      <h1>安驾服务商平台</h1>
      <p>请使用账号密码登录后台系统</p>
      <form id="login-form">
        <div class="field"><input id="login-username" value="sxcdzdl" autocomplete="username" /></div>
        <div class="field"><input id="login-password" value="Han35128819" type="password" autocomplete="current-password" /></div>
        <button type="submit" class="login-btn">登录</button>
      </form>
      <div id="login-msg"></div>
    </div>
  </div>

  <div id="app-shell" class="app-shell">
    <header class="top-header">
      <div>安驾服务商平台 <small id="top-company"></small></div>
      <div class="right">平台联系方式：<span id="top-contact"></span> <span id="top-user" style="margin-left:8px;"></span></div>
    </header>
    <section class="app-body">
      <aside id="left-nav">
        <div id="menu-tree"></div>
      </aside>
      <section class="main-wrap">
        <div id="global-msg"></div>
        <div id="main-toolbar">
          <div id="toolbar-title">首页</div>
          <div class="toolbar-actions">
            <button id="toolbar-refresh">刷新</button>
            <button id="toolbar-logout" class="primary">退出</button>
          </div>
        </div>
        <main id="page-root"></main>
      </section>
    </section>
  </div>

  <script>
    window.__API_BASE__ = ${JSON.stringify(apiBaseUrl)};
    window.__API_ENDPOINTS__ = {
      login: '/api/v1/auth/login',
      me: '/api/v1/me',
      menu: '/api/v1/menu',
      providers: '/api/v1/providers',
      walletSummary: '/api/v1/sales/wallet/summary',
      walletList: '/api/v1/sales/wallet/transactions',
      departments: '/api/v1/system/departments',
      users: '/api/v1/system/users',
      courseware: '/api/v1/courseware'
    };
  </script>
  <script src="/app.js"></script>
</body>
</html>`;
}

export function createWebServer(apiBaseUrl: string): Server {
  return createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method === 'GET' && req.url === '/app.js') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.end(clientScript);
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(buildPage(apiBaseUrl));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.WEB_PORT || 3000);
  const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
  const server = createWebServer(apiBaseUrl);
  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[web] listening on http://127.0.0.1:${port}, api=${apiBaseUrl}`);
  });
}
