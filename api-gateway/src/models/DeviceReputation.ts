import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceReputation extends Document {
  [key: string]: any;
}

const DeviceReputationSchema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  reputationScore: { type: Number, required: true, default: 100 },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  historicalFlags: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const DeviceReputation = mongoose.models.DeviceReputation || mongoose.model<IDeviceReputation>('DeviceReputation', DeviceReputationSchema);
