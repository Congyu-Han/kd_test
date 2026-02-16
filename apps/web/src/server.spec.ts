import { describe, expect, it } from 'vitest';
import { buildPage } from './server';

describe('web page shell', () => {
  it('contains screenshot-style shell containers', () => {
    const html = buildPage('http://127.0.0.1:3001');
    expect(html).toContain('安驾服务商平台');
    expect(html).toContain('id="left-nav"');
    expect(html).toContain('id="main-toolbar"');
    expect(html).toContain('id="page-root"');
  });

  it('contains core module api endpoints for full product flow', () => {
    const html = buildPage('http://127.0.0.1:3001');
    expect(html).toContain('/api/v1/providers');
    expect(html).toContain('/api/v1/sales/wallet/summary');
    expect(html).toContain('/api/v1/system/departments');
    expect(html).toContain('/api/v1/courseware');
  });
});
