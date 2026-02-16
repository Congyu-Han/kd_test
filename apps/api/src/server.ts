import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  createJsonStore,
  type CoursewareRecord,
  type DepartmentRecord,
  type PaymentAccountRecord,
  type ProviderAccountRecord,
  type RoleRecord,
  type SalesLedgerRecord,
  type SalesOrderRecord,
  type ServiceProviderRecord,
  type UserRecord,
  type WalletTransactionRecord
} from './data/store';

type Session = {
  userId: string;
  expiresAt: number;
};

type MenuItem = {
  key: string;
  title: string;
  children?: MenuItem[];
};

type ListEnvelope<T> = {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
};

const sessions = new Map<string, Session>();

function requestId(): string {
  return `req_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function setCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

function text(res: ServerResponse, statusCode: number, contentType: string, body: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseUrl(urlText: string | undefined): URL {
  return new URL(urlText || '/', 'http://127.0.0.1');
}

function getPageNum(value: string | null, fallback: number): number {
  const parsed = Number(value || '');
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function paginate<T>(items: T[], page: number, pageSize: number): ListEnvelope<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const list = items.slice(start, start + pageSize);
  return {
    list,
    page,
    pageSize,
    total
  };
}

function toCsv(rows: Record<string, string | number | boolean | null>[]): string {
  if (rows.length === 0) {
    return '';
  }
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: string | number | boolean | null): string => {
    const textValue = value === null ? '' : String(value);
    if (textValue.includes(',') || textValue.includes('"') || textValue.includes('\n')) {
      return `"${textValue.replaceAll('"', '""')}"`;
    }
    return textValue;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => escapeCell(row[key] ?? '')).join(','));
  }
  return lines.join('\n');
}

function resolveRoleName(roles: RoleRecord[], roleId: string): string {
  return roles.find((role) => role.id === roleId)?.name ?? '未知角色';
}

function resolveDepartmentName(departments: DepartmentRecord[], departmentId: string | null): string {
  if (!departmentId) {
    return '-';
  }
  return departments.find((dep) => dep.id === departmentId)?.name ?? '-';
}

function getMenu(): MenuItem[] {
  return [
    { key: 'providers', title: '下级服务商管理' },
    {
      key: 'sales',
      title: '销售管理',
      children: [
        { key: 'sales.wallet', title: '线上收益钱包' },
        { key: 'sales.orders', title: '售课订单' },
        { key: 'sales.monthly', title: '月度统计' },
        { key: 'sales.offline', title: '线下课时订单管理' },
        { key: 'sales.distribution', title: '分配企业课时记录' },
        { key: 'sales.ledger', title: '两类人员培训销售账单' }
      ]
    },
    {
      key: 'quota',
      title: '课时/券管理',
      children: [
        { key: 'quota.purchase', title: '购买课时' },
        { key: 'quota.records', title: '购买记录' },
        { key: 'coupon.config', title: '培训券定价' },
        { key: 'coupon.dispatch', title: '派券记录' }
      ]
    },
    {
      key: 'system',
      title: '系统管理',
      children: [
        { key: 'system.accounts', title: '收款账户管理' },
        { key: 'system.departments', title: '部门管理' },
        { key: 'system.users', title: '用户管理' },
        { key: 'system.permissions', title: '权限管理' }
      ]
    },
    { key: 'courseware', title: '课件管理' }
  ];
}

function authUser(req: IncomingMessage, users: UserRecord[]): UserRecord | null {
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

  const user = users.find((item) => item.id === session.userId) ?? null;
  if (!user || user.status !== 'enabled') {
    return null;
  }

  return user;
}

function requireAuth(req: IncomingMessage, res: ServerResponse, users: UserRecord[]): UserRecord | null {
  const user = authUser(req, users);
  if (!user) {
    json(res, 401, 'unauthorized', '请先登录', null);
    return null;
  }
  return user;
}

function nowText(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function createApiServer(): Server {
  const store = createJsonStore();

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = parseUrl(req.url);
    const path = url.pathname;
    const segments = path.split('/').filter(Boolean);

    if (req.method === 'GET' && path === '/api/v1/health') {
      json(res, 200, 'ok', 'success', { status: 'ok' });
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/auth/login') {
      const body = await readBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '');

      const user = store.db.users.find((item) => item.username === username && item.password === password && item.status === 'enabled');
      if (!user) {
        json(res, 401, 'invalid_credentials', '用户名或密码错误', null);
        return;
      }

      const token = randomUUID();
      sessions.set(token, {
        userId: user.id,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000
      });

      json(res, 200, 'ok', 'success', {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 12 * 60 * 60
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/auth/logout') {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer ')) {
        const token = auth.slice('Bearer '.length).trim();
        sessions.delete(token);
      }
      json(res, 200, 'ok', 'success', { success: true });
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/me') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      json(res, 200, 'ok', 'success', {
        id: user.id,
        username: user.username,
        name: user.name,
        role: resolveRoleName(store.db.roles, user.roleId),
        roleId: user.roleId,
        departmentId: user.departmentId
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/menu') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      json(res, 200, 'ok', 'success', getMenu());
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/dashboard') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const totalIncome = store.db.walletTransactions.reduce((sum, item) => sum + item.incomeAmount, 0);
      json(res, 200, 'ok', 'success', {
        providerCount: store.db.serviceProviders.length,
        userCount: store.db.users.length,
        orderCount: store.db.salesOrders.length,
        totalIncome
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/providers') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const keyword = (url.searchParams.get('keyword') || '').trim();
      const area = (url.searchParams.get('area') || '').trim();
      const type = (url.searchParams.get('type') || '').trim();
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);

      const filtered = store.db.serviceProviders.filter((item) => {
        if (keyword && !item.serviceProviderName.includes(keyword) && !item.principal.includes(keyword) && !item.phone.includes(keyword)) {
          return false;
        }
        if (area && item.area !== area) {
          return false;
        }
        if (type && item.serviceProviderType !== type) {
          return false;
        }
        return true;
      });

      json(res, 200, 'ok', 'success', paginate(filtered, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/providers') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const body = await readBody(req);
      const serviceProviderName = String(body.serviceProviderName || '').trim();
      if (!serviceProviderName) {
        json(res, 400, 'invalid_input', '服务商名称不能为空', null);
        return;
      }

      const provider: ServiceProviderRecord = {
        id: store.nextId('provider'),
        serviceProviderName,
        serviceProviderType: String(body.serviceProviderType || '服务商').trim(),
        area: String(body.area || '未设置').trim(),
        principal: String(body.principal || '未设置').trim(),
        phone: String(body.phone || '未设置').trim(),
        enterpriseCount: Number(body.enterpriseCount || 0),
        userCount: Number(body.userCount || 0),
        pricing: Number(body.pricing || 3),
        classBalance: Number(body.classBalance || 0),
        status: 'enabled',
        createdAt: nowText()
      };

      store.db.serviceProviders.unshift(provider);
      store.save();
      json(res, 200, 'ok', 'success', provider);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'providers' && segments[4] === 'status') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const providerId = segments[3];
      const provider = store.db.serviceProviders.find((item) => item.id === providerId);
      if (!provider) {
        json(res, 404, 'not_found', '服务商不存在', null);
        return;
      }

      const body = await readBody(req);
      const status = String(body.status || '').trim();
      if (status !== 'enabled' && status !== 'disabled') {
        json(res, 400, 'invalid_input', '状态不合法', null);
        return;
      }

      provider.status = status;
      store.save();
      json(res, 200, 'ok', 'success', provider);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'providers' && segments.length === 4) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const providerId = segments[3];
      const provider = store.db.serviceProviders.find((item) => item.id === providerId);
      if (!provider) {
        json(res, 404, 'not_found', '服务商不存在', null);
        return;
      }

      const body = await readBody(req);
      if (body.serviceProviderName !== undefined) provider.serviceProviderName = String(body.serviceProviderName);
      if (body.serviceProviderType !== undefined) provider.serviceProviderType = String(body.serviceProviderType);
      if (body.area !== undefined) provider.area = String(body.area);
      if (body.principal !== undefined) provider.principal = String(body.principal);
      if (body.phone !== undefined) provider.phone = String(body.phone);
      if (body.enterpriseCount !== undefined) provider.enterpriseCount = Number(body.enterpriseCount);
      if (body.userCount !== undefined) provider.userCount = Number(body.userCount);
      if (body.pricing !== undefined) provider.pricing = Number(body.pricing);
      if (body.classBalance !== undefined) provider.classBalance = Number(body.classBalance);

      store.save();
      json(res, 200, 'ok', 'success', provider);
      return;
    }

    if (req.method === 'GET' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'providers' && segments[4] === 'accounts') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const providerId = segments[3];
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      const list = store.db.providerAccounts.filter((item) => item.providerId === providerId);
      json(res, 200, 'ok', 'success', paginate(list, page, pageSize));
      return;
    }

    if (req.method === 'POST' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'providers' && segments[4] === 'accounts') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const providerId = segments[3];
      const provider = store.db.serviceProviders.find((item) => item.id === providerId);
      if (!provider) {
        json(res, 404, 'not_found', '服务商不存在', null);
        return;
      }

      const body = await readBody(req);
      const accountName = String(body.accountName || '').trim();
      const accountNo = String(body.accountNo || '').trim();
      if (!accountName || !accountNo) {
        json(res, 400, 'invalid_input', '账户名称和账号不能为空', null);
        return;
      }

      const account: ProviderAccountRecord = {
        id: store.nextId('provider_account'),
        providerId,
        accountName,
        accountNo,
        bankName: String(body.bankName || '未设置').trim(),
        status: 'enabled'
      };
      store.db.providerAccounts.unshift(account);
      store.save();
      json(res, 200, 'ok', 'success', account);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/wallet/summary') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const totalIncome = store.db.walletTransactions.reduce((sum, item) => sum + item.incomeAmount, 0);
      const totalAmount = store.db.walletTransactions.reduce((sum, item) => sum + item.transactionAmount, 0);
      json(res, 200, 'ok', 'success', {
        totalIncome,
        totalAmount,
        transactionCount: store.db.walletTransactions.length
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/wallet/transactions') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const keyword = (url.searchParams.get('keyword') || '').trim();
      const providerKeyword = (url.searchParams.get('provider') || '').trim();
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);

      const list = store.db.walletTransactions.filter((item) => {
        if (keyword && !item.target.includes(keyword) && !item.orderNo.includes(keyword) && !item.transactionType.includes(keyword)) {
          return false;
        }
        if (providerKeyword && !item.target.includes(providerKeyword)) {
          return false;
        }
        return true;
      });
      json(res, 200, 'ok', 'success', paginate(list, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/orders') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.salesOrders, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/monthly-stats') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 12);
      json(res, 200, 'ok', 'success', paginate(store.db.monthlyStats, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/offline-orders') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.offlineOrders, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/distributions') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.distributionRecords, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/sales/ledgers') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.salesLedgers, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/quota/purchases') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.quotaPurchases, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/quota/purchases') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const providerName = String(body.providerName || '').trim();
      const classHours = Number(body.classHours || 0);
      const amount = Number(body.amount || 0);
      if (!providerName || classHours <= 0 || amount <= 0) {
        json(res, 400, 'invalid_input', '购买参数不合法', null);
        return;
      }

      const purchase = {
        id: store.nextId('quota_purchase'),
        providerName,
        classHours,
        amount,
        createdAt: nowText()
      };
      store.db.quotaPurchases.unshift(purchase);
      store.db.quotaRecords.unshift({
        id: store.nextId('quota_record'),
        providerName,
        action: '购买',
        classHours,
        createdAt: nowText()
      });
      store.save();
      json(res, 200, 'ok', 'success', purchase);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/quota/records') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.quotaRecords, page, pageSize));
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/coupon/configs') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.couponConfigs, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/coupon/configs') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const couponType = String(body.couponType || '').trim();
      const faceValue = Number(body.faceValue || 0);
      const price = Number(body.price || 0);
      if (!couponType || faceValue <= 0 || price <= 0) {
        json(res, 400, 'invalid_input', '培训券定价参数不合法', null);
        return;
      }
      const config = {
        id: store.nextId('coupon_cfg'),
        couponType,
        faceValue,
        price,
        status: 'enabled' as const
      };
      store.db.couponConfigs.unshift(config);
      store.save();
      json(res, 200, 'ok', 'success', config);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/coupon/dispatches') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.couponDispatches, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/coupon/dispatches') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const couponType = String(body.couponType || '').trim();
      const receiver = String(body.receiver || '').trim();
      const quantity = Number(body.quantity || 0);
      if (!couponType || !receiver || quantity <= 0) {
        json(res, 400, 'invalid_input', '派券参数不合法', null);
        return;
      }
      const dispatch = {
        id: store.nextId('coupon_dispatch'),
        couponType,
        receiver,
        quantity,
        operator: user.name,
        createdAt: nowText()
      };
      store.db.couponDispatches.unshift(dispatch);
      store.save();
      json(res, 200, 'ok', 'success', dispatch);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/system/payment-accounts') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      json(res, 200, 'ok', 'success', paginate(store.db.paymentAccounts, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/system/payment-accounts') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const accountName = String(body.accountName || '').trim();
      const accountNo = String(body.accountNo || '').trim();
      if (!accountName || !accountNo) {
        json(res, 400, 'invalid_input', '收款账户名称和账号不能为空', null);
        return;
      }
      const account: PaymentAccountRecord = {
        id: store.nextId('payment_account'),
        accountName,
        accountNo,
        bankName: String(body.bankName || '未设置').trim(),
        status: 'enabled'
      };
      store.db.paymentAccounts.unshift(account);
      store.save();
      json(res, 200, 'ok', 'success', account);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'system' && segments[3] === 'payment-accounts' && segments.length === 5) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const account = store.db.paymentAccounts.find((item) => item.id === segments[4]);
      if (!account) {
        json(res, 404, 'not_found', '收款账户不存在', null);
        return;
      }
      const body = await readBody(req);
      if (body.accountName !== undefined) account.accountName = String(body.accountName);
      if (body.accountNo !== undefined) account.accountNo = String(body.accountNo);
      if (body.bankName !== undefined) account.bankName = String(body.bankName);
      if (body.status === 'enabled' || body.status === 'disabled') account.status = body.status;
      store.save();
      json(res, 200, 'ok', 'success', account);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/system/departments') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 200);
      const keyword = (url.searchParams.get('keyword') || '').trim();
      const list = keyword
        ? store.db.departments.filter((item) => item.name.includes(keyword))
        : store.db.departments;
      json(res, 200, 'ok', 'success', paginate(list, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/system/departments') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const parentId = body.parentId ? String(body.parentId) : null;
      if (!name) {
        json(res, 400, 'invalid_input', '部门名称不能为空', null);
        return;
      }
      const department: DepartmentRecord = {
        id: store.nextId('department'),
        name,
        parentId
      };
      store.db.departments.push(department);
      store.save();
      json(res, 200, 'ok', 'success', department);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'system' && segments[3] === 'departments' && segments.length === 5) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const department = store.db.departments.find((item) => item.id === segments[4]);
      if (!department) {
        json(res, 404, 'not_found', '部门不存在', null);
        return;
      }
      const body = await readBody(req);
      if (body.name !== undefined) department.name = String(body.name);
      if (body.parentId !== undefined) department.parentId = body.parentId ? String(body.parentId) : null;
      store.save();
      json(res, 200, 'ok', 'success', department);
      return;
    }

    if (req.method === 'DELETE' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'system' && segments[3] === 'departments' && segments.length === 5) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const departmentId = segments[4];
      const hasChild = store.db.departments.some((item) => item.parentId === departmentId);
      if (hasChild) {
        json(res, 409, 'conflict', '请先删除子部门', null);
        return;
      }
      const next = store.db.departments.filter((item) => item.id !== departmentId);
      if (next.length === store.db.departments.length) {
        json(res, 404, 'not_found', '部门不存在', null);
        return;
      }
      store.db.departments = next;
      store.db.users = store.db.users.map((item) => (item.departmentId === departmentId ? { ...item, departmentId: null } : item));
      store.save();
      json(res, 200, 'ok', 'success', { id: departmentId, deleted: true });
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/system/users') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);
      const keyword = (url.searchParams.get('keyword') || '').trim();
      const roleId = (url.searchParams.get('roleId') || '').trim();

      const list = store.db.users
        .filter((item) => {
          if (keyword && !item.name.includes(keyword) && !item.username.includes(keyword)) return false;
          if (roleId && item.roleId !== roleId) return false;
          return true;
        })
        .map((item) => ({
          ...item,
          roleName: resolveRoleName(store.db.roles, item.roleId),
          departmentName: resolveDepartmentName(store.db.departments, item.departmentId)
        }));

      json(res, 200, 'ok', 'success', paginate(list, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/system/users') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const username = String(body.username || '').trim();
      const password = String(body.password || '').trim();
      const name = String(body.name || '').trim();
      const roleId = String(body.roleId || '').trim();
      if (!username || !password || !name || !roleId) {
        json(res, 400, 'invalid_input', '用户参数不完整', null);
        return;
      }
      if (store.db.users.some((item) => item.username === username)) {
        json(res, 409, 'conflict', '用户名已存在', null);
        return;
      }
      const userRecord: UserRecord = {
        id: store.nextId('user'),
        username,
        password,
        name,
        roleId,
        status: 'enabled',
        departmentId: body.departmentId ? String(body.departmentId) : null
      };
      store.db.users.unshift(userRecord);
      store.save();
      json(res, 200, 'ok', 'success', userRecord);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'system' && segments[3] === 'users' && segments.length === 5) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const userRecord = store.db.users.find((item) => item.id === segments[4]);
      if (!userRecord) {
        json(res, 404, 'not_found', '用户不存在', null);
        return;
      }
      const body = await readBody(req);
      if (body.name !== undefined) userRecord.name = String(body.name);
      if (body.roleId !== undefined) userRecord.roleId = String(body.roleId);
      if (body.status === 'enabled' || body.status === 'disabled') userRecord.status = body.status;
      if (body.departmentId !== undefined) userRecord.departmentId = body.departmentId ? String(body.departmentId) : null;
      store.save();
      json(res, 200, 'ok', 'success', userRecord);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/system/roles') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 20);
      json(res, 200, 'ok', 'success', paginate(store.db.roles, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/system/roles') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      if (!name) {
        json(res, 400, 'invalid_input', '角色名称不能为空', null);
        return;
      }
      const permissions = Array.isArray(body.permissions)
        ? body.permissions.map((item) => String(item)).filter(Boolean)
        : [];
      const role: RoleRecord = {
        id: store.nextId('role'),
        name,
        permissions
      };
      store.db.roles.unshift(role);
      store.save();
      json(res, 200, 'ok', 'success', role);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/courseware') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const keyword = (url.searchParams.get('keyword') || '').trim();
      const industry = (url.searchParams.get('industry') || '').trim();
      const tag = (url.searchParams.get('tag') || '').trim();
      const source = (url.searchParams.get('source') || '').trim();
      const onlyTest = url.searchParams.get('onlyTest') === '1';
      const page = getPageNum(url.searchParams.get('page'), 1);
      const pageSize = getPageNum(url.searchParams.get('pageSize'), 10);

      const list = store.db.courseware.filter((item) => {
        if (keyword && !item.title.includes(keyword)) return false;
        if (industry && item.industry !== industry) return false;
        if (tag && item.tag !== tag) return false;
        if (source && item.source !== source) return false;
        if (onlyTest && !item.isTest) return false;
        return true;
      });

      json(res, 200, 'ok', 'success', paginate(list, page, pageSize));
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/courseware') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const body = await readBody(req);
      const title = String(body.title || '').trim();
      if (!title) {
        json(res, 400, 'invalid_input', '课件标题不能为空', null);
        return;
      }

      const course: CoursewareRecord = {
        id: store.nextId('course'),
        title,
        industry: String(body.industry || '交通运输').trim(),
        tag: String(body.tag || '未分类').trim(),
        source: String(body.source || '企业课件').trim(),
        upVotes: 0,
        comments: 0,
        downVotes: 0,
        duration: String(body.duration || '00:08:00').trim(),
        updatedAt: nowText().slice(0, 10),
        status: String(body.status || '企业课件').trim(),
        isTest: Boolean(body.isTest)
      };
      store.db.courseware.unshift(course);
      store.save();
      json(res, 200, 'ok', 'success', course);
      return;
    }

    if (req.method === 'GET' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'courseware' && segments.length === 4) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;

      const course = store.db.courseware.find((item) => item.id === segments[3]);
      if (!course) {
        json(res, 404, 'not_found', '课件不存在', null);
        return;
      }
      json(res, 200, 'ok', 'success', course);
      return;
    }

    if (req.method === 'PATCH' && segments[0] === 'api' && segments[1] === 'v1' && segments[2] === 'courseware' && segments.length === 4) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const course = store.db.courseware.find((item) => item.id === segments[3]);
      if (!course) {
        json(res, 404, 'not_found', '课件不存在', null);
        return;
      }
      const body = await readBody(req);
      if (body.title !== undefined) course.title = String(body.title);
      if (body.industry !== undefined) course.industry = String(body.industry);
      if (body.tag !== undefined) course.tag = String(body.tag);
      if (body.source !== undefined) course.source = String(body.source);
      if (body.status !== undefined) course.status = String(body.status);
      if (body.isTest !== undefined) course.isTest = Boolean(body.isTest);
      course.updatedAt = nowText().slice(0, 10);
      store.save();
      json(res, 200, 'ok', 'success', course);
      return;
    }

    if (req.method === 'GET' && path.startsWith('/api/v1/export/')) {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const moduleKey = path.slice('/api/v1/export/'.length);
      if (moduleKey === 'providers') {
        const csvRows = store.db.serviceProviders.map((item) => ({
          id: item.id,
          serviceProviderName: item.serviceProviderName,
          serviceProviderType: item.serviceProviderType,
          area: item.area,
          principal: item.principal,
          phone: item.phone,
          enterpriseCount: item.enterpriseCount,
          userCount: item.userCount,
          pricing: item.pricing,
          classBalance: item.classBalance,
          status: item.status
        }));
        text(res, 200, 'text/csv; charset=utf-8', toCsv(csvRows));
        return;
      }
      if (moduleKey === 'courseware') {
        const csvRows = store.db.courseware.map((item) => ({
          id: item.id,
          title: item.title,
          industry: item.industry,
          tag: item.tag,
          source: item.source,
          status: item.status,
          updatedAt: item.updatedAt
        }));
        text(res, 200, 'text/csv; charset=utf-8', toCsv(csvRows));
        return;
      }
      if (moduleKey === 'wallet') {
        const csvRows = store.db.walletTransactions.map((item) => ({
          id: item.id,
          transactionTime: item.transactionTime,
          transactionType: item.transactionType,
          target: item.target,
          transactionAmount: item.transactionAmount,
          incomeAmount: item.incomeAmount,
          orderNo: item.orderNo
        }));
        text(res, 200, 'text/csv; charset=utf-8', toCsv(csvRows));
        return;
      }
      json(res, 404, 'not_found', '导出模块不存在', null);
      return;
    }

    // Compatibility endpoints used by older smoke scripts.
    if (req.method === 'GET' && path === '/api/v1/companies') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const list = store.db.serviceProviders.map((item) => ({
        id: item.id,
        name: item.serviceProviderName,
        status: item.status,
        contact: item.principal
      }));
      json(res, 200, 'ok', 'success', list);
      return;
    }

    if (req.method === 'GET' && path === '/api/v1/orders') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const list = store.db.salesOrders.map((item) => ({
        id: item.id,
        companyId: item.customer,
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt
      }));
      json(res, 200, 'ok', 'success', list);
      return;
    }

    if (req.method === 'POST' && path === '/api/v1/orders') {
      const user = requireAuth(req, res, store.db.users);
      if (!user) return;
      const body = await readBody(req);
      const amount = Number(body.amount || 0);
      const companyId = String(body.companyId || '').trim();
      if (!companyId || amount <= 0) {
        json(res, 400, 'invalid_input', '订单参数不合法', null);
        return;
      }
      const order: SalesOrderRecord = {
        id: store.nextId('sales_order'),
        orderNo: `SO${Date.now()}`,
        customer: companyId,
        amount,
        status: '待支付',
        createdAt: nowText()
      };
      store.db.salesOrders.unshift(order);
      store.save();
      json(res, 200, 'ok', 'success', {
        id: order.id,
        companyId: order.customer,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt
      });
      return;
    }

    json(res, 404, 'not_found', 'Not Found', null);
  }

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
