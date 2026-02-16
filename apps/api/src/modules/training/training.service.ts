export interface TrainingStat {
  month: string;
  companyId: string;
  hours: number;
}

export class TrainingService {
  private readonly stats: TrainingStat[] = [];

  async seed(stat: TrainingStat): Promise<void> {
    this.stats.push(stat);
  }

  async monthly(query: { month: string }): Promise<TrainingStat[]> {
    return this.stats.filter((item) => item.month === query.month);
  }
}
