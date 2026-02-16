export interface PassengerTransportItem {
  id: string;
  companyId: string;
  route: string;
}

export class PassengerController {
  list(): PassengerTransportItem[] {
    return [];
  }
}
