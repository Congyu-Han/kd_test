import { describe, expect, it } from 'vitest';
import { buildPage } from './server';

describe('web page', () => {
  it('contains login form, sidebar menu and content container', () => {
    const html = buildPage('http://127.0.0.1:3001');
    expect(html).toContain('id="login-form"');
    expect(html).toContain('id="sidebar-menu"');
    expect(html).toContain('id="content-view"');
  });

  it('contains core api routes for product flow', () => {
    const html = buildPage('http://127.0.0.1:3001');
    expect(html).toContain('/api/v1/auth/login');
    expect(html).toContain('/api/v1/companies');
    expect(html).toContain('/api/v1/orders');
  });
});
