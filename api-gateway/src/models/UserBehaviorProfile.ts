import mongoose, { Schema, Document } from 'mongoose';

export interface UserBehaviorProfileDocument extends Document {
    userId: string;
    avgTransactionAmount: number;
    avgTransactionFrequency: number; // transactions per day
    commonLocations: string[];
    commonDevices: string[];
    riskScore: number;
    behaviorDeviationScore: number;
    lastTransactionAt: Date;
    transactionCount: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const userBehaviorProfileSchema = new Schema<UserBehaviorProfileDocument>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        avgTransactionAmount: { type: Number, default: 0 },
        avgTransactionFrequency: { type: Number, default: 0 },
        commonLocations: { type: [String], default: [] },
        commonDevices: { type: [String], default: [] },
        riskScore: { type: Number, default: 0 },
        behaviorDeviationScore: { type: Number, default: 0 },
        lastTransactionAt: { type: Date, default: Date.now },
        transactionCount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 }
    },
    { timestamps: true, collection: 'user_behavior_profiles' }
);

export const UserBehaviorProfileModel = mongoose.model<UserBehaviorProfileDocument>(
    'UserBehaviorProfile',
    userBehaviorProfileSchema
);
