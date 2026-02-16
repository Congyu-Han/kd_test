import { randomUUID } from 'node:crypto';

export class RequestIdInterceptor {
  issueRequestId(existingId?: string): string {
    return existingId || randomUUID();
  }
}
