export interface BillItem {
  id: string;
  companyId: string;
  amount: number;
  status: string;
}

export class BillController {
  list(): BillItem[] {
    return [];
  }
}
