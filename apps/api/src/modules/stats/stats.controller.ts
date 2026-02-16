export interface DashboardStat {
  label: string;
  value: number;
}

export class StatsController {
  dashboard(): DashboardStat[] {
    return [
      { label: '企业数', value: 0 },
      { label: '订单数', value: 0 }
    ];
  }
}
