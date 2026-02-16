import { describe, expect, it } from 'vitest';
import { buildPage } from './server';

describe('web page', () => {
  it('contains api endpoint for company list fetch', () => {
    const html = buildPage('http://127.0.0.1:3001');
    expect(html).toContain('/api/v1/companies');
    expect(html).toContain('http://127.0.0.1:3001');
  });
});
