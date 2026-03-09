import mongoose, { Schema, Document } from 'mongoose';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED';

export interface Alert {
    alertId: string;
    transactionId: string;
    userId: string;
    fraudScore: number;
    severity: AlertSeverity;
    status: AlertStatus;
    channels: string[];
    payload: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface AlertDocument extends Alert, Document { }

const AlertSchema: Schema = new Schema({
    alertId: { type: String, required: true, unique: true },
    transactionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    fraudScore: { type: Number, required: true },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    status: {
        type: String,
        enum: ['OPEN', 'ACKNOWLEDGED'],
        default: 'OPEN'
    },
    channels: [{ type: String }],
    payload: { type: Schema.Types.Mixed },
}, {
    timestamps: true
});

export const AlertModel = mongoose.model<AlertDocument>('Alert', AlertSchema);
