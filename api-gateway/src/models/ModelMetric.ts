import mongoose, { Document, Schema } from 'mongoose';

interface ScoreDistribution {
  low: number;
  medium: number;
  high: number;
}

interface InputDistribution {
  avgAmount: number;
  uniqueDevices: number;
  uniqueLocations: number;
}

export interface ModelMetricDocument extends Document {
  snapshotAt: Date;
  fraudRate: number;
  avgFraudScore: number;
  scoreDistribution: ScoreDistribution;
  inputDistribution: InputDistribution;
  driftDetected: boolean;
  driftReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scoreDistributionSchema = new Schema<ScoreDistribution>(
  {
    low: { type: Number, required: true },
    medium: { type: Number, required: true },
    high: { type: Number, required: true }
  },
  { _id: false }
);

const inputDistributionSchema = new Schema<InputDistribution>(
  {
    avgAmount: { type: Number, required: true },
    uniqueDevices: { type: Number, required: true },
    uniqueLocations: { type: Number, required: true }
  },
  { _id: false }
);

const modelMetricSchema = new Schema<ModelMetricDocument>(
  {
    snapshotAt: { type: Date, required: true, index: true, default: () => new Date() },
    fraudRate: { type: Number, required: true },
    avgFraudScore: { type: Number, required: true },
    scoreDistribution: { type: scoreDistributionSchema, required: true },
    inputDistribution: { type: inputDistributionSchema, required: true },
    driftDetected: { type: Boolean, required: true, index: true, default: false },
    driftReason: { type: String, required: false }
  },
  { timestamps: true, collection: 'model_metrics' }
);

export const ModelMetricModel = mongoose.model<ModelMetricDocument>('ModelMetric', modelMetricSchema);
