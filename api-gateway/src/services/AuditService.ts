import { AuditLogRepository } from '../repositories/AuditLogRepository';

export interface AuditActor {
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
}

export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(input: {
    eventType: string;
    action: string;
    entityType: string;
    entityId?: string;
    actor?: AuditActor;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditLogRepository.create({
      eventType: input.eventType,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actor?.actorId,
      actorEmail: input.actor?.actorEmail,
      ipAddress: input.actor?.ipAddress,
      metadata: input.metadata ?? {}
    });
  }

  async listRecent(limit = 200) {
    return this.auditLogRepository.listRecent(limit);
  }
}
