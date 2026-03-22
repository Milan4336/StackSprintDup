import mongoose, { Document, Schema } from 'mongoose';

export interface UserRiskProfileDocument extends Document {
  userId: string;
  avgTransactionAmount: number;
  transactionVelocity: number;
  deviceCount: number;
  locationChangeFrequency: number;
  updatedAt: Date;
  createdAt: Date;
}

const userRiskProfileSchema = new Schema<UserRiskProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    avgTransactionAmount: { type: Number, required: true, default: 0 },
    transactionVelocity: { type: Number, required: true, default: 0 },
    deviceCount: { type: Number, required: true, default: 0 },
    locationChangeFrequency: { type: Number, required: true, default: 0 }
  },
  { timestamps: true, collection: 'user_risk_profiles' }
);

export const UserRiskProfileModel = mongoose.model<UserRiskProfileDocument>('UserRiskProfile', userRiskProfileSchema);
