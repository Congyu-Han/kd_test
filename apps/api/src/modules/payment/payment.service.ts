import { createHmac } from 'node:crypto';

export interface PaymentServiceConfig {
  callbackSecret: string;
}

export interface PaymentCallbackPayload {
  channel: string;
  tradeNo: string;
  orderId: string;
  amount: number;
  signature: string;
}

export interface PaymentRecord {
  id: string;
  channel: string;
  tradeNo: string;
  orderId: string;
  amount: number;
}

export class PaymentService {
  private readonly records = new Map<string, PaymentRecord>();

  constructor(private readonly config: PaymentServiceConfig) {}

  sign(channel: string, tradeNo: string, orderId: string, amount: number): string {
    const plain = `${channel}|${tradeNo}|${orderId}|${amount}`;
    return createHmac('sha256', this.config.callbackSecret).update(plain).digest('hex');
  }

  async handleCallback(payload: PaymentCallbackPayload): Promise<void> {
    const expected = this.sign(payload.channel, payload.tradeNo, payload.orderId, payload.amount);
    if (payload.signature !== expected) {
      throw new Error('invalid_signature');
    }

    const dedupeKey = `${payload.channel}:${payload.tradeNo}`;
    if (this.records.has(dedupeKey)) {
      return;
    }

    this.records.set(dedupeKey, {
      id: `p_${this.records.size + 1}`,
      channel: payload.channel,
      tradeNo: payload.tradeNo,
      orderId: payload.orderId,
      amount: payload.amount
    });
  }

  async findByTradeNo(tradeNo: string): Promise<PaymentRecord[]> {
    return [...this.records.values()].filter((item) => item.tradeNo === tradeNo);
  }
}
