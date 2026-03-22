import mongoose, { Document, Schema } from 'mongoose';

export interface FraudAlertDocument extends Document {
  alertId: string;
  transactionId: string;
  userId: string;
  fraudScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
  status: 'open' | 'investigating' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const fraudAlertSchema = new Schema<FraudAlertDocument>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    transactionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    fraudScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open', index: true }
  },
  { timestamps: true, collection: 'fraud_alerts' }
);

export const FraudAlertModel = mongoose.model<FraudAlertDocument>('FraudAlert', fraudAlertSchema);
