import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemMetrics extends Document {
  [key: string]: any;
}

const SystemMetricsSchema = new Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  cpuUsage: { type: Number },
  memoryUsage: { type: Number },
  activeConnections: { type: Number },
  latencyMs: { type: Number }
}, { timestamps: true });

export const SystemMetrics = mongoose.models.SystemMetrics || mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema);
