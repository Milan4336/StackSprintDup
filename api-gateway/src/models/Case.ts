import mongoose, { Document, Schema } from 'mongoose';

export type CaseStatus = 'NEW' | 'UNDER_INVESTIGATION' | 'ESCALATED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CaseTimelineItem {
  at: Date;
  actor: string;
  action: string;
  note?: string;
}

export interface CaseDocument extends Document {
  caseId: string;
  transactionId: string;
  alertId?: string;
  investigatorId?: string;
  caseStatus: CaseStatus;
  priority: CasePriority;
  caseNotes: string[];
  evidenceFiles: string[];
  timeline: CaseTimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const caseTimelineSchema = new Schema<CaseTimelineItem>(
  {
    at: { type: Date, required: true },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    note: { type: String, required: false }
  },
  { _id: false }
);

const caseSchema = new Schema<CaseDocument>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    alertId: { type: String, required: false, index: true },
    investigatorId: { type: String, required: false, index: true },
    caseStatus: {
      type: String,
      enum: ['NEW', 'UNDER_INVESTIGATION', 'ESCALATED', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'RESOLVED'],
      required: true,
      default: 'NEW',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      default: 'MEDIUM',
      index: true
    },
    caseNotes: { type: [String], default: [] },
    evidenceFiles: { type: [String], default: [] },
    timeline: { type: [caseTimelineSchema], default: [] }
  },
  { timestamps: true, collection: 'cases' }
);

export const CaseModel = mongoose.model<CaseDocument>('Case', caseSchema);
