import { describe, expect, it } from 'vitest';
import { OrderService } from './order.service';

describe('OrderService', () => {
  it('creates purchase order and transitions to paid after callback', async () => {
    const service = new OrderService();

    const order = await service.createPurchase({ companyId: 'c_1', amount: 100 });
    await service.markPaid(order.id, 'trade_001');
    const latest = await service.detail(order.id);

    expect(latest.status).toBe('paid');
  });
});
