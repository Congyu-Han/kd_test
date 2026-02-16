export type OrderStatus = 'created' | 'paid';

export interface PurchaseOrderInput {
  companyId: string;
  amount: number;
}

export interface OrderRecord {
  id: string;
  companyId: string;
  amount: number;
  tradeNo: string | null;
  status: OrderStatus;
}

export class OrderService {
  private readonly orders = new Map<string, OrderRecord>();

  async createPurchase(input: PurchaseOrderInput): Promise<OrderRecord> {
    const order: OrderRecord = {
      id: `o_${this.orders.size + 1}`,
      companyId: input.companyId,
      amount: input.amount,
      tradeNo: null,
      status: 'created'
    };

    this.orders.set(order.id, order);
    return order;
  }

  async markPaid(orderId: string, tradeNo: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('order_not_found');
    }

    order.tradeNo = tradeNo;
    order.status = 'paid';
  }

  async detail(orderId: string): Promise<OrderRecord> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('order_not_found');
    }

    return order;
  }
}
