import { describe, expect, it } from 'vitest';
import { DistributionService } from './distribution.service';

describe('DistributionService', () => {
  it('returns distribution records by date range and status', async () => {
    const service = new DistributionService();
    await service.seed({
      id: 'd_1',
      status: 'completed',
      happenedAt: '2026-02-01'
    });

    const result = await service.list({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      status: 'completed'
    });

    expect(result.items.length).toBeGreaterThan(0);
  });
});
