import mongoose, { Document, Schema } from 'mongoose';

export interface FraudExplanationItem {
  feature: string;
  impact: number;
  reason: string;
}

export interface FraudExplanationDocument extends Document {
  transactionId: string;
  userId: string;
  fraudScore: number;
  explanations: FraudExplanationItem[];
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

const fraudExplanationSchema = new Schema<FraudExplanationDocument>(
  {
    transactionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    fraudScore: { type: Number, required: true },
    explanations: { type: [explanationItemSchema], required: true }
  },
  { timestamps: true, collection: 'fraud_explanations' }
);

export const FraudExplanationModel = mongoose.model<FraudExplanationDocument>(
  'FraudExplanation',
  fraudExplanationSchema
);
