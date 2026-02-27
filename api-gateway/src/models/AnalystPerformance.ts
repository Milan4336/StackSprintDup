import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalystPerformance extends Document {
  [key: string]: any;
}

const AnalystPerformanceSchema = new Schema({
  analystId: { type: String, required: true, index: true },
  casesResolved: { type: Number, default: 0 },
  averageResolutionTimeMs: { type: Number },
  falsePositiveRate: { type: Number },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export const AnalystPerformance = mongoose.models.AnalystPerformance || mongoose.model<IAnalystPerformance>('AnalystPerformance', AnalystPerformanceSchema);
