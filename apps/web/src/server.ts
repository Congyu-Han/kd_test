import { createServer } from 'node:http';
import type { Server } from 'node:http';

export function buildPage(apiBaseUrl: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KDS Clone 联调页</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 24px; }
    h1 { margin-bottom: 8px; }
    button { padding: 8px 14px; cursor: pointer; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow: auto; }
  </style>
</head>
<body>
  <h1>KDS Clone 前后端联调</h1>
  <p>API Base: ${apiBaseUrl}</p>
  <button id="load">加载企业列表</button>
  <pre id="result">点击按钮请求 /api/v1/companies</pre>
  <script>
    const apiBase = ${JSON.stringify(apiBaseUrl)};
    const btn = document.getElementById('load');
    const result = document.getElementById('result');
    btn.addEventListener('click', async () => {
      try {
        const res = await fetch(apiBase + '/api/v1/companies');
        const json = await res.json();
        result.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        result.textContent = String(err);
      }
    });
  </script>
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
