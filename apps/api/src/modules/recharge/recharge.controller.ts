export interface RechargeItem {
  id: string;
  companyId: string;
  amount: number;
}

export class RechargeController {
  list(): RechargeItem[] {
    return [];
  }
}
