import mongoose, { Document, Schema } from 'mongoose';

export interface IDriftMetrics extends Document {
  [key: string]: any;
}

const DriftMetricsSchema = new Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  modelName: { type: String, required: true },
  klDivergence: { type: Number, required: true },
  featureDriftScores: { type: Schema.Types.Mixed }
}, { timestamps: true });

export const DriftMetrics = mongoose.models.DriftMetrics || mongoose.model<IDriftMetrics>('DriftMetrics', DriftMetricsSchema);
