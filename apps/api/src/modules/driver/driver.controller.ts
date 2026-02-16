export interface DriverListItem {
  id: string;
  name: string;
  licenseNo: string;
}

export class DriverController {
  list(): DriverListItem[] {
    return [];
  }
}
