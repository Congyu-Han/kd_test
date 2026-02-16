import { describe, expect, it } from 'vitest';
import { TrainingService } from './training.service';

describe('TrainingService', () => {
  it('returns monthly training statistics by enterprise', async () => {
    const service = new TrainingService();
    await service.seed({ month: '2026-02', companyId: 'c_1', hours: 16 });

    const stats = await service.monthly({ month: '2026-02' });

    expect(stats[0]).toEqual(expect.objectContaining({ companyId: expect.any(String) }));
  });
});
