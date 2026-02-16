import { ExportService } from './export.service';

export class ExportProcessor {
  constructor(private readonly exportService: ExportService) {}

  async process(jobId: string): Promise<void> {
    await this.exportService.process(jobId);
  }
}
