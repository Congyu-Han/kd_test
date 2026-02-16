import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiServer } from './server';

let server: Awaited<ReturnType<typeof createApiServer>>;
let baseUrl = '';

beforeAll(async () => {
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
});

describe('api server', () => {
  it('supports login and authorized company list', async () => {
    const unauth = await fetch(`${baseUrl}/api/v1/companies`);
    expect(unauth.status).toBe(401);

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Passw0rd!' })
    });
    expect(login.status).toBe(200);
    const loginBody = (await login.json()) as { data: { accessToken: string } };
    expect(loginBody.data.accessToken).toBeTruthy();

    const res = await fetch(`${baseUrl}/api/v1/companies`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.accessToken}`
      }
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; name: string }> };
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('returns profile and menu after login', async () => {
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Passw0rd!' })
    });
    const loginBody = (await login.json()) as { data: { accessToken: string } };
    const token = loginBody.data.accessToken;

    const me = await fetch(`${baseUrl}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { data: { username: string } };
    expect(meBody.data.username).toBe('admin');

    const menu = await fetch(`${baseUrl}/api/v1/menu`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(menu.status).toBe(200);
    const menuBody = (await menu.json()) as { data: Array<{ key: string }> };
    expect(menuBody.data.length).toBeGreaterThan(3);
  });
});
