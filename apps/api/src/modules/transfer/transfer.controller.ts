import { TransferService, type CreateTransferInput, type TransferOrder } from './transfer.service';

export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  create(input: CreateTransferInput): Promise<TransferOrder> {
    return this.transferService.create(input);
  }
}
