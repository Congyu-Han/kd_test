export interface AuditLogRecord {
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
}

export class AuditService {
  private readonly records: AuditLogRecord[] = [];

  log(record: AuditLogRecord): void {
    this.records.push(record);
  }

  all(): AuditLogRecord[] {
    return this.records;
  }
}
