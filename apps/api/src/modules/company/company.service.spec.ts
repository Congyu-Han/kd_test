import { describe, expect, it } from 'vitest';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  it('filters companies by keyword and status', async () => {
    const service = new CompanyService();
    await service.seed({ name: '运输企业A', status: 'active' });
    await service.seed({ name: '运输企业B', status: 'inactive' });

    const result = await service.list({ keyword: '运输', status: 'active' });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items[0].status).toBe('active');
  });
});
