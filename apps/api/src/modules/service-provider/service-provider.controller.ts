export interface ServiceProviderItem {
  id: string;
  name: string;
  status: string;
}

export class ServiceProviderController {
  list(): ServiceProviderItem[] {
    return [];
  }
}
