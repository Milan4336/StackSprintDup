import mongoose, { Document, Schema } from 'mongoose';

export interface IThreatIndexHistory extends Document {
  [key: string]: any;
}

const ThreatIndexHistorySchema = new Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  score: { type: Number, required: true },
  components: {
    globalRisk: Number,
    spikeFactor: Number,
    driftScore: Number,
    alertPressure: Number
  }
}, { timestamps: true });

export const ThreatIndexHistory = mongoose.models.ThreatIndexHistory || mongoose.model<IThreatIndexHistory>('ThreatIndexHistory', ThreatIndexHistorySchema);
