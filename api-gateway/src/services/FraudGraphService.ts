import { FraudGraphEdgeModel } from '../models/FraudGraphEdge';
import { MlServiceClient } from './MlServiceClient';
import { logger } from '../config/logger';

export class FraudGraphService {
    constructor(private readonly mlClient: MlServiceClient) { }

    /**
     * Updates the fraud graph with new edges and returns an anomaly score [0-1].
     */
    async updateGraphAndGetAnomaly(input: {
        userId: string;
        deviceId: string;
        ipAddress: string;
        transactionId?: string;
        fraudScore?: number;
    }): Promise<number> {
        const { userId, deviceId, ipAddress, transactionId, fraudScore = 0 } = input;

        // Core edges
        await this.upsertEdge(userId, 'USER', deviceId, 'DEVICE', 'USED_BY', fraudScore);
        await this.upsertEdge(userId, 'USER', ipAddress, 'IP', 'CONNECTED_TO', fraudScore);
        await this.upsertEdge(deviceId, 'DEVICE', ipAddress, 'IP', 'SHARED_WITH', fraudScore);

        // Transaction → User edge
        if (transactionId) {
            await this.upsertEdge(transactionId, 'TRANSACTION', userId, 'USER', 'TX_USER', fraudScore);
        }

        // Detect shared suspicious entities
        const sharingUsers = await FraudGraphEdgeModel.countDocuments({
            toId: deviceId,
            toType: 'DEVICE',
            relationshipType: 'USED_BY'
        });

        const sharingIps = await FraudGraphEdgeModel.countDocuments({
            toId: ipAddress,
            toType: 'IP',
            relationshipType: 'CONNECTED_TO'
        });

        let anomalyScore = 0;
        if (sharingUsers > 3) anomalyScore += 0.5;
        if (sharingIps > 5) anomalyScore += 0.3;
        if (fraudScore > 0.7) anomalyScore = Math.max(anomalyScore, 0.6);

        return Math.min(1, anomalyScore);
    }

    /**
     * Fetches enriched graph analytics from the ML service NetworkX engine.
     */
    async getGraphAnalytics(): Promise<{
        nodes: any[];
        clusters: any[];
        totalNodes: number;
        totalEdges: number;
    }> {
        try {
            return await this.mlClient.getGraphAnalytics();
        } catch (err) {
            logger.warn(`Graph analytics unavailable: ${(err as Error)?.message ?? err}`);
            return { nodes: [], clusters: [], totalNodes: 0, totalEdges: 0 };
        }
    }

    /**
     * Returns enriched graph data for D3 — nodes + links with risk metadata.
     */
    async getEnrichedNetwork(limit: number): Promise<{
        nodes: any[];
        links: any[];
        clusters: any[];
    }> {
        const [edges, analytics] = await Promise.all([
            FraudGraphEdgeModel.find().sort({ lastSeenAt: -1 }).limit(limit),
            this.getGraphAnalytics()
        ]);

        // Build node metric lookup from ML service
        const metricsByNodeId = new Map<string, Record<string, unknown>>();
        for (const m of analytics.nodes) {
            metricsByNodeId.set(m.nodeId, m);
        }

        const nodesMap = new Map<string, any>();
        const links: any[] = [];

        for (const edge of edges) {
            const fromMetrics = metricsByNodeId.get(edge.fromId);
            if (!nodesMap.has(edge.fromId)) {
                nodesMap.set(edge.fromId, {
                    id: edge.fromId,
                    type: edge.fromType,
                    riskScore: fromMetrics ? Math.round((fromMetrics as any).fraudScore * 100) : 0,
                    fraudNeighborRatio: (fromMetrics as any)?.fraudNeighborRatio ?? 0,
                    clusterDensity: (fromMetrics as any)?.clusterDensity ?? 0,
                    graphScore: (fromMetrics as any)?.graphScore ?? 0,
                    sharedDevices: (fromMetrics as any)?.sharedDeviceCount ?? 0,
                    sharedIPs: (fromMetrics as any)?.sharedIPCount ?? 0,
                    isFraudCluster: ((fromMetrics as any)?.graphScore ?? 0) > 0.6,
                    val: edge.fromType === 'USER' ? 8 : edge.fromType === 'TRANSACTION' ? 4 : 5,
                });
            }

            const toMetrics = metricsByNodeId.get(edge.toId);
            if (!nodesMap.has(edge.toId)) {
                nodesMap.set(edge.toId, {
                    id: edge.toId,
                    type: edge.toType,
                    riskScore: toMetrics ? Math.round((toMetrics as any).fraudScore * 100) : 0,
                    fraudNeighborRatio: (toMetrics as any)?.fraudNeighborRatio ?? 0,
                    clusterDensity: (toMetrics as any)?.clusterDensity ?? 0,
                    graphScore: (toMetrics as any)?.graphScore ?? 0,
                    sharedDevices: (toMetrics as any)?.sharedDeviceCount ?? 0,
                    sharedIPs: (toMetrics as any)?.sharedIPCount ?? 0,
                    isFraudCluster: ((toMetrics as any)?.graphScore ?? 0) > 0.6,
                    val: edge.toType === 'USER' ? 8 : edge.toType === 'TRANSACTION' ? 4 : 5,
                });
            }

            links.push({
                source: edge.fromId,
                target: edge.toId,
                value: edge.weight,
                type: edge.relationshipType,
                fraudScore: edge.fraudScore ?? 0,
            });
        }

        return {
            nodes: Array.from(nodesMap.values()),
            links,
            clusters: analytics.clusters,
        };
    }

    private async upsertEdge(
        fromId: string,
        fromType: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD',
        toId: string,
        toType: 'USER' | 'DEVICE' | 'IP' | 'TRANSACTION' | 'CARD',
        rel: string,
        fraudScore = 0
    ): Promise<void> {
        await FraudGraphEdgeModel.findOneAndUpdate(
            { fromId, toId, relationshipType: rel },
            {
                fromType,
                toType,
                fraudScore,
                $inc: { weight: 1 },
                lastSeenAt: new Date()
            },
            { upsert: true, new: true }
        );
    }
}
