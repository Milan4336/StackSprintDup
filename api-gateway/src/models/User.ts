import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'analyst';

export interface UserDocument extends Document {
  email: string;
  password: string;
  role: UserRole;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'analyst'], required: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
