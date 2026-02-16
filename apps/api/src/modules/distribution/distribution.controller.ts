import { DistributionService, type DistributionQuery, type DistributionResult } from './distribution.service';

export class DistributionController {
  constructor(private readonly distributionService: DistributionService) {}

  list(query: DistributionQuery): Promise<DistributionResult> {
    return this.distributionService.list(query);
  }
}
