export interface BeneficiaryAccount {
  id: string;
  accountName: string;
  accountNo: string;
}

export class BeneficiaryController {
  list(): BeneficiaryAccount[] {
    return [];
  }
}
