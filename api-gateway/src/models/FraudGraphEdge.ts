import mongoose, { Schema, Document } from 'mongoose';

export interface FraudGraphEdgeDocument extends Document {
    fromId: string;
    fromType: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD';
    toId: string;
    toType: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD';
    relationshipType: 'OWNED_BY' | 'USED_BY' | 'CONNECTED_TO' | 'SHARED_WITH' | 'TX_USER';
    weight: number;
    fraudScore: number;
    isSuspicious: boolean;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const fraudGraphEdgeSchema = new Schema<FraudGraphEdgeDocument>(
    {
        fromId: { type: String, required: true, index: true },
        fromType: { type: String, enum: ['USER', 'DEVICE', 'IP', 'TRANSACTION', 'CARD'], required: true },
        toId: { type: String, required: true, index: true },
        toType: { type: String, enum: ['USER', 'DEVICE', 'IP', 'TRANSACTION', 'CARD'], required: true },
        relationshipType: { type: String, required: true },
        weight: { type: Number, default: 1 },
        fraudScore: { type: Number, default: 0 },
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
