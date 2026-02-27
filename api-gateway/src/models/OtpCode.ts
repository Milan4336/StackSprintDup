import mongoose, { Schema, Document } from 'mongoose';

export interface OtpCodeDocument extends Document {
    userId: string;
    code: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const otpCodeSchema = new Schema<OtpCodeDocument>(
    {
        userId: { type: String, required: true, index: true },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        used: { type: Boolean, default: false }
    },
    { timestamps: true, collection: 'otp_codes' }
);

// TTL index to automatically delete expired codes
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCodeModel = mongoose.model<OtpCodeDocument>('OtpCode', otpCodeSchema);
