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
  it('returns company list for /api/v1/companies', async () => {
    const res = await fetch(`${baseUrl}/api/v1/companies`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Array<{ id: string; name: string }> };
    expect(body.data.length).toBeGreaterThan(0);
  });
});
