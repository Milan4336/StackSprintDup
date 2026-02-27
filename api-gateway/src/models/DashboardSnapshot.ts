import mongoose, { Document, Schema } from 'mongoose';

export interface IDashboardSnapshot extends Document {
  [key: string]: any;
}

const DashboardSnapshotSchema = new Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  metrics: { type: Schema.Types.Mixed, required: true },
  type: { type: String, required: true, index: true }
}, { timestamps: true });

export const DashboardSnapshot = mongoose.models.DashboardSnapshot || mongoose.model<IDashboardSnapshot>('DashboardSnapshot', DashboardSnapshotSchema);
