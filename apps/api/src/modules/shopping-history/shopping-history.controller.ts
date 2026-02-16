export interface ShoppingHistoryItem {
  id: string;
  companyId: string;
  amount: number;
  boughtAt: string;
}

export class ShoppingHistoryController {
  list(): ShoppingHistoryItem[] {
    return [];
  }
}
