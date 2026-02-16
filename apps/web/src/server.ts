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
  <title>KDS Operator Clone</title>
  <style>
    :root {
      --bg: #f3f5f8;
      --panel: #ffffff;
      --ink: #182333;
      --muted: #5d697a;
      --brand: #0f5f9a;
      --accent: #1b8ad3;
      --line: #d9e2ec;
      --danger: #c63737;
      --ok: #1f7a3f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at 15% 10%, #e8f2fb, #f3f5f8 45%);
      color: var(--ink);
      font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    }
    .app-shell { display: none; min-height: 100vh; }
    .app-shell.show { display: flex; }
    .login-wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .login-card {
      width: 360px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(15, 95, 154, 0.18);
      padding: 24px;
    }
    .login-title { margin: 0 0 4px 0; font-size: 24px; }
    .login-subtitle { margin: 0 0 18px 0; color: var(--muted); font-size: 13px; }
    .field { margin-bottom: 12px; }
    .field label { display: block; margin-bottom: 6px; color: var(--muted); font-size: 13px; }
    .field input, .field select {
      width: 100%;
      height: 40px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 10px;
      font-size: 14px;
    }
    .btn {
      height: 40px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(90deg, var(--brand), var(--accent));
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      padding: 0 14px;
    }
    .btn.secondary {
      background: #eef4fb;
      color: var(--brand);
      border: 1px solid #c8dff5;
    }
    .msg { font-size: 13px; margin-top: 10px; min-height: 18px; }
    .msg.err { color: var(--danger); }
    .msg.ok { color: var(--ok); }
    .sidebar {
      width: 232px;
      background: linear-gradient(180deg, #0f3f64, #0f2e49);
      color: #d6e6f5;
      padding: 16px 12px;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand {
      font-size: 16px;
      font-weight: 700;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      margin-bottom: 10px;
    }
    .menu { list-style: none; margin: 0; padding: 0; }
    .menu li button {
      width: 100%;
      border: none;
      background: transparent;
      color: inherit;
      text-align: left;
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .menu li button.active, .menu li button:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
    .main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      height: 56px;
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }
    .content { padding: 16px; }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .panel h3 { margin: 0 0 12px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: #fff;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 9px 8px;
      text-align: left;
    }
    th { color: #486078; background: #f9fbfd; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .stat { border: 1px solid var(--line); border-radius: 10px; padding: 10px; background: #fdfefe; }
    .stat .label { color: var(--muted); font-size: 12px; }
    .stat .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    @media (max-width: 920px) {
      .sidebar { width: 188px; }
      .stat-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="login-wrap" id="login-view">
    <div class="login-card">
      <h1 class="login-title">运营商平台</h1>
      <p class="login-subtitle">请输入账号密码进入系统</p>
      <form id="login-form">
        <div class="field">
          <label>账号</label>
          <input id="login-username" value="admin" autocomplete="username" />
        </div>
        <div class="field">
          <label>密码</label>
          <input id="login-password" type="password" value="Passw0rd!" autocomplete="current-password" />
        </div>
        <button class="btn" type="submit" style="width:100%;">登录</button>
      </form>
      <div id="login-msg" class="msg"></div>
    </div>
  </div>

  <div class="app-shell" id="app-shell">
    <aside class="sidebar">
      <div class="brand">KDS Clone Console</div>
      <ul class="menu" id="sidebar-menu"></ul>
    </aside>
    <section class="main">
      <header class="topbar">
        <strong id="page-title">首页看板</strong>
        <div>
          <span id="user-name" style="margin-right:10px;color:#3a5672;"></span>
          <button class="btn secondary" id="logout-btn">退出</button>
        </div>
      </header>
      <main class="content" id="content-view"></main>
    </section>
  </div>

  <script>
    window.__API_BASE__ = ${JSON.stringify(apiBaseUrl)};
    window.__API_ENDPOINTS__ = [
      '/api/v1/auth/login',
      '/api/v1/companies',
      '/api/v1/orders'
    ];
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
