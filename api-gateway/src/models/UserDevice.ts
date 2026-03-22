import mongoose, { Document, Schema } from 'mongoose';

export interface UserDeviceDocument extends Document {
  userId: string;
  deviceId: string;
  location: string;
  firstSeen: Date;
  lastSeen: Date;
  txCount: number;
  isSuspicious: boolean;
  riskLevel: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  updatedAt: Date;
}

const userDeviceSchema = new Schema<UserDeviceDocument>(
  {
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    location: { type: String, required: true },
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true },
    txCount: { type: Number, required: true, default: 0 },
    isSuspicious: { type: Boolean, required: true, default: false },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true, default: 'Low' }
  },
  { timestamps: true, collection: 'user_devices' }
);

userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const UserDeviceModel = mongoose.model<UserDeviceDocument>('UserDevice', userDeviceSchema);
