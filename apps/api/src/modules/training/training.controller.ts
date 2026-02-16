import { TrainingService, type TrainingStat } from './training.service';

export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  monthly(month: string): Promise<TrainingStat[]> {
    return this.trainingService.monthly({ month });
  }
}
