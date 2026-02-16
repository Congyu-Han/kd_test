export type ExportJobStatus = 'pending' | 'completed';

export interface ExportJobInput {
  type: string;
  query: Record<string, string>;
}

export interface ExportJob {
  id: string;
  type: string;
  query: Record<string, string>;
  status: ExportJobStatus;
  fileUrl: string | null;
}

export class ExportService {
  private readonly jobs = new Map<string, ExportJob>();

  async createJob(input: ExportJobInput): Promise<ExportJob> {
    const job: ExportJob = {
      id: `job_${this.jobs.size + 1}`,
      type: input.type,
      query: input.query,
      status: 'pending',
      fileUrl: null
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async process(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('job_not_found');
    }

    job.status = 'completed';
    job.fileUrl = `/exports/${job.id}.csv`;
  }

  async get(jobId: string): Promise<ExportJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('job_not_found');
    }

    return job;
  }
}
