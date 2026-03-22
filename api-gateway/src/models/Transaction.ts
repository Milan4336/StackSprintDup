import mongoose, { Schema, Document } from 'mongoose';
import type { FraudExplanationItem } from './FraudExplanation';

export interface TransactionDocument extends Document {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  latitude: number;
  longitude: number;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
  fraudScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  isFraud: boolean;
  explanations?: FraudExplanationItem[];
  createdAt: Date;
  updatedAt: Date;
}

const explanationItemSchema = new Schema<FraudExplanationItem>(
  {
    feature: { type: String, required: true },
    impact: { type: Number, required: true },
    reason: { type: String, required: true }
  },
  { _id: false }
);

const transactionSchema = new Schema<TransactionDocument>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    deviceId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    fraudScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true, index: true },
    isFraud: { type: Boolean, required: true, index: true },
    explanations: { type: [explanationItemSchema], default: [] }
  },
  { timestamps: true, collection: 'transactions' }
);

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
