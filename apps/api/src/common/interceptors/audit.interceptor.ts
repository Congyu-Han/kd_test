import { AuditService, type AuditLogRecord } from '../../modules/audit/audit.service';

export class AuditInterceptor {
  constructor(private readonly auditService: AuditService) {}

  capture(record: AuditLogRecord): void {
    this.auditService.log(record);
  }
}
