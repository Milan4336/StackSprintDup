import { v4 as uuidv4 } from 'uuid';
import { CasePriority, CaseStatus } from '../models/Case';
import { CaseRepository } from '../repositories/CaseRepository';
import { AuditService, AuditActor } from './AuditService';

export class CaseService {
  constructor(
    private readonly caseRepository: CaseRepository,
    private readonly auditService: AuditService
  ) { }

  async create(input: {
    transactionId: string;
    alertId?: string;
    investigatorId?: string;
    status?: CaseStatus;
    priority?: CasePriority;
    notes?: string[];
    actor?: AuditActor;
  }) {
    const noteSeed = (input.notes ?? []).filter(Boolean);
    const created = await this.caseRepository.create({
      caseId: `case-${uuidv4().slice(0, 8)}`,
      transactionId: input.transactionId,
      alertId: input.alertId,
      investigatorId: input.investigatorId,
      caseStatus: input.status ?? 'NEW',
      priority: input.priority ?? 'MEDIUM',
      caseNotes: noteSeed,
      evidenceFiles: [],
      timeline: [
        {
          at: new Date(),
          actor: input.actor?.actorEmail ?? 'system',
          action: 'CASE_CREATED',
          note: noteSeed[0] ?? 'Initial suspicious transaction detected'
        }
      ]
    });

    await this.auditService.log({
      eventType: 'CASE_CREATED',
      action: 'create',
      entityType: 'case',
      entityId: created.caseId,
      actor: input.actor,
      metadata: {
        transactionId: created.transactionId,
        priority: created.priority,
        status: created.caseStatus
      }
    });

    return created;
  }

  async assignInvestigator(caseId: string, investigatorId: string, actor?: AuditActor) {
    const existing = await this.caseRepository.findByCaseId(caseId);
    if (!existing) return null;

    const timeline = [
      ...existing.timeline,
      {
        at: new Date(),
        actor: actor?.actorEmail ?? 'system',
        action: 'INVESTIGATOR_ASSIGNED',
        note: `Case assigned to investigator: ${investigatorId}`
      }
    ];

    const updated = await this.caseRepository.updateByCaseId(caseId, {
      investigatorId,
      caseStatus: existing.caseStatus === 'NEW' ? 'UNDER_INVESTIGATION' : existing.caseStatus,
      timeline
    });

    if (updated) {
      await this.auditService.log({
        eventType: 'CASE_ASSIGNED',
        action: 'assign',
        entityType: 'case',
        entityId: updated.caseId,
        actor,
        metadata: { investigatorId }
      });
    }

    return updated;
  }

  async addEvidence(caseId: string, fileUrl: string, actor?: AuditActor) {
    const existing = await this.caseRepository.findByCaseId(caseId);
    if (!existing) return null;

    const evidenceFiles = [...existing.evidenceFiles, fileUrl];
    const timeline = [
      ...existing.timeline,
      {
        at: new Date(),
        actor: actor?.actorEmail ?? 'system',
        action: 'EVIDENCE_ADDED',
        note: `Evidence attached: ${fileUrl.split('/').pop()}`
      }
    ];

    return this.caseRepository.updateByCaseId(caseId, { evidenceFiles, timeline });
  }

  async updateStatus(caseId: string, status: CaseStatus, note?: string, actor?: AuditActor) {
    const existing = await this.caseRepository.findByCaseId(caseId);
    if (!existing) return null;

    const timeline = [
      ...existing.timeline,
      {
        at: new Date(),
        actor: actor?.actorEmail ?? 'system',
        action: `STATUS_CHANGED_${status}`,
        note: note ?? `Case status updated to ${status}`
      }
    ];

    const caseNotes = [...existing.caseNotes];
    if (note) caseNotes.push(note);

    const updated = await this.caseRepository.updateByCaseId(caseId, {
      caseStatus: status,
      caseNotes,
      timeline
    });

    if (updated) {
      await this.auditService.log({
        eventType: 'CASE_STATUS_UPDATED',
        action: 'update',
        entityType: 'case',
        entityId: updated.caseId,
        actor,
        metadata: { status }
      });
    }

    return updated;
  }

  async list(input: {
    page?: number;
    limit?: number;
    status?: CaseStatus;
    priority?: CasePriority;
    investigatorId?: string;
    transactionId?: string;
  }) {
    return this.caseRepository.list({
      page: Math.max(1, input.page ?? 1),
      limit: Math.max(1, Math.min(200, input.limit ?? 25)),
      status: input.status,
      priority: input.priority,
      investigatorId: input.investigatorId,
      transactionId: input.transactionId
    });
  }
}
