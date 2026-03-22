import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'analyst' | 'user';

export interface UserDocument extends Document {
  userId: string;
  email: string;
  password: string;
  role: UserRole;
  status: 'ACTIVE' | 'RESTRICTED' | 'FROZEN';
  riskScore: number;
  lastLogin?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaVerifiedAt?: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'analyst', 'user'], required: true },
    status: { type: String, enum: ['ACTIVE', 'RESTRICTED', 'FROZEN'], default: 'ACTIVE' },
    riskScore: { type: Number, default: 0 },
    lastLogin: { type: Date },
    mfaEnabled: { type: Boolean, default: false, index: true },
    mfaSecret: { type: String, required: false, select: false },
    mfaVerifiedAt: { type: Date, required: false }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
