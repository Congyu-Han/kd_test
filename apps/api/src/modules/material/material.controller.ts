export interface MaterialListItem {
  id: string;
  name: string;
  price: number;
}

export class MaterialController {
  list(): MaterialListItem[] {
    return [];
  }
}
