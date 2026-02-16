import { PaymentService, type PaymentCallbackPayload } from './payment.service';

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  callback(payload: PaymentCallbackPayload): Promise<void> {
    return this.paymentService.handleCallback(payload);
  }
}
