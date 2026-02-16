import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';

type User = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
};

type MenuItem = {
  key: string;
  title: string;
};

type Company = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  contact: string;
};

type Order = {
  id: string;
  companyId: string;
  amount: number;
  status: 'created' | 'paid';
  createdAt: string;
};

type Session = {
  userId: string;
  expiresAt: number;
};

const users: User[] = [
  {
    id: 'u_admin',
    username: 'admin',
    password: 'Passw0rd!',
    name: '系统管理员',
    role: 'admin'
  }
];

const roleMenus: Record<string, MenuItem[]> = {
  admin: [
    { key: 'dashboard', title: '首页看板' },
    { key: 'companies', title: '企业管理' },
    { key: 'orders', title: '订单管理' },
    { key: 'users', title: '用户管理' },
    { key: 'stats', title: '统计报表' }
  ]
};

const companies: Company[] = [
  { id: 'c_1', name: '运输企业A', status: 'active', contact: '张三' },
  { id: 'c_2', name: '运输企业B', status: 'inactive', contact: '李四' }
];

const orders: Order[] = [
  { id: 'o_1', companyId: 'c_1', amount: 1200, status: 'paid', createdAt: '2026-02-16 09:00:00' },
  { id: 'o_2', companyId: 'c_1', amount: 680, status: 'created', createdAt: '2026-02-16 10:12:00' }
];

const sessions = new Map<string, Session>();

function requestId(): string {
  return `req_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function json(res: ServerResponse, statusCode: number, code: string, message: string, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      code,
      message,
      requestId: requestId(),
      data
    })
  );
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

function authUser(req: IncomingMessage): User | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return null;
  }

  const token = auth.slice('Bearer '.length).trim();
  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return users.find((item) => item.id === session.userId) ?? null;
}

function requireAuth(req: IncomingMessage, res: ServerResponse): User | null {
  const user = authUser(req);
  if (!user) {
    json(res, 401, 'unauthorized', '请先登录', null);
    return null;
  }
  return user;
}

function normalizePath(urlText: string | undefined): string {
  if (!urlText) return '/';
  try {
    const parsed = new URL(urlText, 'http://localhost');
    return parsed.pathname;
  } catch {
    return urlText.split('?')[0] || '/';
  }
}

function buildDashboard(): { companyCount: number; orderCount: number; paidAmount: number } {
  const paidAmount = orders.filter((o) => o.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
  return {
    companyCount: companies.length,
    orderCount: orders.length,
    paidAmount
  };
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const path = normalizePath(req.url);

  if (req.method === 'GET' && path === '/api/v1/health') {
    json(res, 200, 'ok', 'success', { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && path === '/api/v1/auth/login') {
    const body = (await readBody(req)) as { username?: string; password?: string } | null;
    const username = body?.username?.trim();
    const password = body?.password ?? '';
    const user = users.find((item) => item.username === username && item.password === password);

    if (!user) {
      json(res, 401, 'invalid_credentials', '用户名或密码错误', null);
      return;
    }

    const token = randomUUID();
    sessions.set(token, {
      userId: user.id,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000
    });

    json(res, 200, 'ok', 'success', {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60
    });
    return;
  }

  if (req.method === 'POST' && path === '/api/v1/auth/logout') {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      sessions.delete(auth.slice('Bearer '.length).trim());
    }
    json(res, 200, 'ok', 'success', { success: true });
    return;
  }

  if (req.method === 'GET' && path === '/api/v1/me') {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, 'ok', 'success', {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    });
    return;
  }

  if (req.method === 'GET' && path === '/api/v1/menu') {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, 'ok', 'success', roleMenus[user.role] ?? []);
    return;
  }

  if (req.method === 'GET' && path === '/api/v1/dashboard') {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, 'ok', 'success', buildDashboard());
    return;
  }

  if (req.method === 'GET' && path === '/api/v1/companies') {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, 'ok', 'success', companies);
    return;
  }

  if (req.method === 'POST' && path === '/api/v1/companies') {
    const user = requireAuth(req, res);
    if (!user) return;

    const body = (await readBody(req)) as { name?: string; contact?: string } | null;
    const name = body?.name?.trim() ?? '';
    const contact = body?.contact?.trim() ?? '';
    if (!name) {
      json(res, 400, 'invalid_input', '企业名称不能为空', null);
      return;
    }

    const company: Company = {
      id: `c_${companies.length + 1}`,
      name,
      contact: contact || '未填写',
      status: 'active'
    };
    companies.unshift(company);
    json(res, 200, 'ok', 'success', company);
    return;
  }

  if (req.method === 'GET' && path === '/api/v1/orders') {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, 'ok', 'success', orders);
    return;
  }

  if (req.method === 'POST' && path === '/api/v1/orders') {
    const user = requireAuth(req, res);
    if (!user) return;

    const body = (await readBody(req)) as { companyId?: string; amount?: number } | null;
    const companyId = body?.companyId ?? '';
    const amount = Number(body?.amount ?? 0);

    if (!companyId || !Number.isFinite(amount) || amount <= 0) {
      json(res, 400, 'invalid_input', '订单参数不合法', null);
      return;
    }

    const order: Order = {
      id: `o_${orders.length + 1}`,
      companyId,
      amount,
      status: 'created',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    orders.unshift(order);
    json(res, 200, 'ok', 'success', order);
    return;
  }

  json(res, 404, 'not_found', 'Not Found', null);
}

export function createApiServer(): Server {
  return createServer((req, res) => {
    void handle(req, res);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.API_PORT || 3001);
  const server = createApiServer();
  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://127.0.0.1:${port}`);
  });
}
