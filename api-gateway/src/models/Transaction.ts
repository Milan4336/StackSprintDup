import mongoose, { Schema, Document } from 'mongoose';
import type { FraudExplanationItem } from './FraudExplanation';

export interface TransactionDocument extends Document {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
  action: 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK';
  ruleScore: number;
  mlScore: number;
  behaviorScore?: number;
  graphScore?: number;
  mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  modelVersion: string;
  modelName: string;
  modelConfidence: number;
  modelScores?: Record<string, number>;
  modelWeights?: Record<string, number>;
  fraudScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  isFraud: boolean;
  geoVelocityFlag?: boolean;
  ruleReasons?: string[];
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
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    city: { type: String, required: false },
    country: { type: String, required: false },
    deviceId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    action: { type: String, enum: ['ALLOW', 'STEP_UP_AUTH', 'BLOCK'], required: true, index: true },
    ruleScore: { type: Number, required: true },
    mlScore: { type: Number, required: true },
    behaviorScore: { type: Number, required: false, default: 0 },
    graphScore: { type: Number, required: false, default: 0 },
    mlStatus: { type: String, enum: ['HEALTHY', 'DEGRADED', 'OFFLINE'], required: true, index: true },
    modelVersion: { type: String, required: true },
    modelName: { type: String, required: true },
    modelConfidence: { type: Number, required: true },
    modelScores: { type: Map, of: Number, required: false },
    modelWeights: { type: Map, of: Number, required: false },
    fraudScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true, index: true },
    isFraud: { type: Boolean, required: true, index: true },
    geoVelocityFlag: { type: Boolean, required: false, default: false },
    ruleReasons: { type: [String], default: [] },
    explanations: { type: [explanationItemSchema], default: [] }
  },
  { timestamps: true, collection: 'transactions' }
);

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', transactionSchema);
