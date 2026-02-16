import { describe, expect, it } from 'vitest';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  it('ignores duplicate callback with same tradeNo and channel', async () => {
    const service = new PaymentService({ callbackSecret: 'secret' });
    const payload = {
      channel: 'wechat',
      tradeNo: 'T20260216',
      orderId: 'o_1',
      amount: 100,
      signature: service.sign('wechat', 'T20260216', 'o_1', 100)
    };

    await service.handleCallback(payload);
    await service.handleCallback(payload);
    const records = await service.findByTradeNo(payload.tradeNo);

    expect(records).toHaveLength(1);
  });
});
