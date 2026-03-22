import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
    deviceHash: string;
    userId: string;
    firstSeen: Date;
    lastSeen: Date;
    deviceTrustScore: number;
    deviceLabel: 'Trusted Device' | 'New Device' | 'Suspicious Device';
    deviceRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical';

    // Raw Telemetry stored for investigational correlation
    userAgent: string;
    platform: string;
    timezone: string;
    gpuVendor: string;
    gpuRenderer: string;
    deviceMemory: string | number;
    cpuCores: string | number;
    lastKnownIp: string;
}

const DeviceSchema: Schema = new Schema({
    deviceHash: { type: String, required: true },
    userId: { type: String, required: true },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    deviceTrustScore: { type: Number, required: true, default: 50 },
    deviceLabel: {
        type: String,
        enum: ['Trusted Device', 'New Device', 'Suspicious Device'],
        default: 'New Device'
    },
    deviceRiskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low'
    },

    // Telemetry metadata
    userAgent: { type: String },
    platform: { type: String },
    timezone: { type: String },
    gpuVendor: { type: String },
    gpuRenderer: { type: String },
    deviceMemory: { type: Schema.Types.Mixed },
    cpuCores: { type: Schema.Types.Mixed },
    lastKnownIp: { type: String }
});

// A unique combination of a generated machine hash and associated user account.
// If the same machine logs into two different accounts, they are tracked as distinct entity pairings, 
// though the graph network will cross-correlate the hashes via the DB.
DeviceSchema.index({ deviceHash: 1, userId: 1 }, { unique: true });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
