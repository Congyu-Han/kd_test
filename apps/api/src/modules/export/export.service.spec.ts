import { describe, expect, it } from 'vitest';
import { ExportService } from './export.service';

describe('ExportService', () => {
  it('creates export job and marks it completed with file url', async () => {
    const service = new ExportService();
    const job = await service.createJob({ type: 'company_stat', query: { month: '2026-02' } });

    await service.process(job.id);
    const done = await service.get(job.id);

    expect(done.status).toBe('completed');
    expect(done.fileUrl).toContain('/exports/');
  });
});
