import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApiServer } from './server';

let server: Awaited<ReturnType<typeof createApiServer>>;
let baseUrl = '';
let dataFile = '';

beforeEach(() => {
  dataFile = join(tmpdir(), `kds-api-spec-${randomUUID()}.json`);
  process.env.KDS_DATA_FILE = dataFile;
});

beforeAll(async () => {
  dataFile = join(tmpdir(), `kds-api-spec-${randomUUID()}.json`);
  process.env.KDS_DATA_FILE = dataFile;
  server = createApiServer();
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('address_unavailable');
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  rmSync(dataFile, { force: true });
});

type Envelope<T> = {
  code: string;
  message: string;
  requestId: string;
  data: T;
};

type ListEnvelope<T> = {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
};

async function loginAndToken(): Promise<string> {
  const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Passw0rd!' })
  });
  expect(login.status).toBe(200);
  const body = (await login.json()) as Envelope<{ accessToken: string }>;
  return body.data.accessToken;
}

async function authedGet<T>(path: string, token: string): Promise<Envelope<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status).toBe(200);
  return (await res.json()) as Envelope<T>;
}

async function authedPost<T>(path: string, token: string, payload: unknown): Promise<Envelope<T>> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  expect(res.status).toBe(200);
  return (await res.json()) as Envelope<T>;
}

describe('api server full module contract', () => {
  it('rejects unauthorized provider list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/providers`);
    expect(res.status).toBe(401);
  });

  it('returns profile and nested menu after login', async () => {
    const token = await loginAndToken();

    const me = await authedGet<{ username: string; name: string }>('/api/v1/me', token);
    expect(me.data.username).toBe('admin');
    expect(me.data.name.length).toBeGreaterThan(0);

    const menu = await authedGet<Array<{ key: string; title: string; children?: unknown[] }>>('/api/v1/menu', token);
    expect(menu.data.length).toBeGreaterThan(4);
    expect(menu.data.some((item) => item.key === 'sales')).toBe(true);
    expect(menu.data.some((item) => item.key === 'system')).toBe(true);
  });

  it('supports provider query, create and status update', async () => {
    const token = await loginAndToken();

    const providers = await authedGet<ListEnvelope<{ id: string; serviceProviderName: string }>>(
      '/api/v1/providers?page=1&pageSize=5',
      token
    );
    expect(providers.data.page).toBe(1);
    expect(providers.data.pageSize).toBe(5);
    expect(providers.data.list.length).toBeGreaterThan(0);

    const created = await authedPost<{ id: string; serviceProviderName: string }>(
      '/api/v1/providers',
      token,
      {
        serviceProviderName: '山西测试服务商',
        serviceProviderType: '服务商',
        area: '太原市',
        principal: '测试负责人',
        phone: '13900001111'
      }
    );
    expect(created.data.id).toBeTruthy();

    const statusRes = await fetch(`${baseUrl}/api/v1/providers/${created.data.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'disabled' })
    });
    expect(statusRes.status).toBe(200);
  });

  it('returns wallet data and exports csv', async () => {
    const token = await loginAndToken();

    const summary = await authedGet<{ totalIncome: number }>('/api/v1/sales/wallet/summary', token);
    expect(summary.data.totalIncome).toBeTypeOf('number');

    const walletList = await authedGet<ListEnvelope<{ transactionType: string }>>(
      '/api/v1/sales/wallet/transactions?page=1&pageSize=10',
      token
    );
    expect(walletList.data.page).toBe(1);

    const exportRes = await fetch(`${baseUrl}/api/v1/export/providers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(exportRes.status).toBe(200);
    expect(exportRes.headers.get('content-type')).toContain('text/csv');
    const csv = await exportRes.text();
    expect(csv).toContain('serviceProviderName');
  });

  it('supports departments and courseware list query', async () => {
    const token = await loginAndToken();

    const depBefore = await authedGet<ListEnvelope<{ id: string; name: string }>>('/api/v1/system/departments', token);
    const depCreated = await authedPost<{ id: string; name: string }>('/api/v1/system/departments', token, {
      name: '安全培训部',
      parentId: depBefore.data.list[0]?.id || null
    });
    expect(depCreated.data.name).toBe('安全培训部');

    const courseware = await authedGet<ListEnvelope<{ id: string; title: string }>>(
      '/api/v1/courseware?keyword=运输&page=1&pageSize=5',
      token
    );
    expect(courseware.data.page).toBe(1);
    expect(courseware.data.pageSize).toBe(5);
  });
});
