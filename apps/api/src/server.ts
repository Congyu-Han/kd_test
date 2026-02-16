import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Server } from 'node:http';

type Company = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
};

const companies: Company[] = [
  { id: 'c_1', name: '运输企业A', status: 'active' },
  { id: 'c_2', name: '运输企业B', status: 'inactive' }
];

function writeJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/v1/health') {
    writeJson(res, 200, {
      code: 'ok',
      message: 'success',
      requestId: 'local-health',
      data: { status: 'ok' }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/v1/companies') {
    writeJson(res, 200, {
      code: 'ok',
      message: 'success',
      requestId: 'local-companies',
      data: companies
    });
    return;
  }

  writeJson(res, 404, {
    code: 'not_found',
    message: 'Not Found',
    requestId: 'local-404',
    data: null
  });
}

export function createApiServer(): Server {
  return createServer(handle);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.API_PORT || 3001);
  const server = createApiServer();
  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://127.0.0.1:${port}`);
  });
}
