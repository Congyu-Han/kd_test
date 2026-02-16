export interface DistributionRecord {
  id: string;
  status: 'completed' | 'pending';
  happenedAt: string;
}

export interface DistributionQuery {
  startDate: string;
  endDate: string;
  status?: 'completed' | 'pending';
}

export interface DistributionResult {
  items: DistributionRecord[];
}

export class DistributionService {
  private readonly records: DistributionRecord[] = [];

  async seed(record: DistributionRecord): Promise<void> {
    this.records.push(record);
  }

  async list(query: DistributionQuery): Promise<DistributionResult> {
    const filtered = this.records.filter((item) => {
      const inRange = item.happenedAt >= query.startDate && item.happenedAt <= query.endDate;
      const statusOk = query.status ? item.status === query.status : true;
      return inRange && statusOk;
    });

    return { items: filtered };
  }
}
