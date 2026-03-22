import { AuditLogDocument, AuditLogModel } from '../models/AuditLog';

export class AuditLogRepository {
  async create(payload: Partial<AuditLogDocument>): Promise<AuditLogDocument> {
    return AuditLogModel.create(payload);
  }

  async listRecent(limit = 200): Promise<AuditLogDocument[]> {
    return AuditLogModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }
}
