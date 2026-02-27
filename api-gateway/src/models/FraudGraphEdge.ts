import mongoose, { Schema, Document } from 'mongoose';

export interface FraudGraphEdgeDocument extends Document {
    fromId: string; // userId, deviceId, or ipAddress
    fromType: 'USER' | 'DEVICE' | 'IP';
    toId: string;
    toType: 'USER' | 'DEVICE' | 'IP';
    relationshipType: 'OWNED_BY' | 'USED_BY' | 'CONNECTED_TO' | 'SHARED_WITH';
    weight: number; // e.g., frequency of connection
    isSuspicious: boolean;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const fraudGraphEdgeSchema = new Schema<FraudGraphEdgeDocument>(
    {
        fromId: { type: String, required: true, index: true },
        fromType: { type: String, enum: ['USER', 'DEVICE', 'IP'], required: true },
        toId: { type: String, required: true, index: true },
        toType: { type: String, enum: ['USER', 'DEVICE', 'IP'], required: true },
        relationshipType: { type: String, required: true },
        weight: { type: Number, default: 1 },
        isSuspicious: { type: Boolean, default: false, index: true },
        lastSeenAt: { type: Date, default: Date.now }
    },
    { timestamps: true, collection: 'fraud_graph_edges' }
);

// Unique index to prevent duplicate edges between same entities
fraudGraphEdgeSchema.index({ fromId: 1, toId: 1, relationshipType: 1 }, { unique: true });

export const FraudGraphEdgeModel = mongoose.model<FraudGraphEdgeDocument>(
    'FraudGraphEdge',
    fraudGraphEdgeSchema
);
