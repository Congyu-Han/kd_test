import { OrderService, type OrderRecord, type PurchaseOrderInput } from './order.service';

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createPurchase(input: PurchaseOrderInput): Promise<OrderRecord> {
    return this.orderService.createPurchase(input);
  }

  detail(orderId: string): Promise<OrderRecord> {
    return this.orderService.detail(orderId);
  }
}
