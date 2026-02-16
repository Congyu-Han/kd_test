export type TransferStatus = 'created' | 'approved' | 'paid';

export interface CreateTransferInput {
  accountId: string;
  amount: number;
}

export interface TransferOrder {
  id: string;
  accountId: string;
  amount: number;
  status: TransferStatus;
}

export class TransferService {
  private readonly orders = new Map<string, TransferOrder>();

  async create(input: CreateTransferInput): Promise<TransferOrder> {
    const order: TransferOrder = {
      id: `t_${this.orders.size + 1}`,
      accountId: input.accountId,
      amount: input.amount,
      status: 'created'
    };

    this.orders.set(order.id, order);
    return order;
  }

  async approve(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('transfer_not_found');
    }
    order.status = 'approved';
  }

  async payout(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('transfer_not_found');
    }
    if (order.status !== 'approved') {
      throw new Error('transfer_not_approved');
    }

    order.status = 'paid';
  }
}
