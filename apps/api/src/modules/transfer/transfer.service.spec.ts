import { describe, expect, it } from 'vitest';
import { TransferService } from './transfer.service';

describe('TransferService', () => {
  it('creates transfer order and enforces approval before payout', async () => {
    const service = new TransferService();
    const order = await service.create({ accountId: 'a_1', amount: 100 });

    await expect(service.payout(order.id)).rejects.toThrow();
  });
});
