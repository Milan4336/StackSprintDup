import mongoose, { Document, Schema } from 'mongoose';

export interface AuditLogDocument extends Document {
  eventType: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    eventType: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    actorId: { type: String, required: false, index: true },
    actorEmail: { type: String, required: false, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: false, index: true },
    metadata: { type: Schema.Types.Mixed, required: false },
    ipAddress: { type: String, required: false }
  },
  { timestamps: true, collection: 'audit_logs' }
);

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
