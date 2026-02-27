import { FraudGraphEdgeModel } from '../models/FraudGraphEdge';

export class FraudGraphService {
    /**
     * Updates the fraud graph with new edges and returns an anomaly score [0-1].
     */
    async updateGraphAndGetAnomaly(input: {
        userId: string;
        deviceId: string;
        ipAddress: string;
    }): Promise<number> {
        const { userId, deviceId, ipAddress } = input;

        // Create or update edges
        await this.upsertEdge(userId, 'USER', deviceId, 'DEVICE', 'USED_BY');
        await this.upsertEdge(userId, 'USER', ipAddress, 'IP', 'CONNECTED_TO');
        await this.upsertEdge(deviceId, 'DEVICE', ipAddress, 'IP', 'SHARED_WITH');

        // Detect shared suspicious entities
        // Heuristic: If this device is shared by > 3 users, it's suspicious
        const sharingUsers = await FraudGraphEdgeModel.countDocuments({
            toId: deviceId,
            toType: 'DEVICE',
            relationshipType: 'USED_BY'
        });

        // Heuristic: If this IP is shared by > 5 users, it's suspicious
        const sharingIps = await FraudGraphEdgeModel.countDocuments({
            toId: ipAddress,
            toType: 'IP',
            relationshipType: 'CONNECTED_TO'
        });

        let anomalyScore = 0;
        if (sharingUsers > 3) anomalyScore += 0.5;
        if (sharingIps > 5) anomalyScore += 0.3;

        return Math.min(1, anomalyScore);
    }

    private async upsertEdge(
        fromId: string,
        fromType: 'USER' | 'DEVICE' | 'IP',
        toId: string,
        toType: 'USER' | 'DEVICE' | 'IP',
        rel: string
    ): Promise<void> {
        await FraudGraphEdgeModel.findOneAndUpdate(
            { fromId, toId, relationshipType: rel },
            {
                fromType,
                toType,
                $inc: { weight: 1 },
                lastSeenAt: new Date()
            },
            { upsert: true, new: true }
        );
    }
}
