import { Request, Response } from 'express';
import { FraudGraphEdgeModel } from '../models/FraudGraphEdge';
import { FraudGraphService } from '../services/FraudGraphService';

export class GraphController {
    constructor(private readonly fraudGraphService: FraudGraphService) { }

    /**
     * GET /api/v1/graph — enriched D3 network with ML-sourced risk metadata and clusters.
     */
    getNetwork = async (req: Request, res: Response): Promise<void> => {
        const limit = Number(req.query.limit ?? 500);
        const enriched = await this.fraudGraphService.getEnrichedNetwork(limit);
        res.status(200).json(enriched);
    };

    /**
     * GET /api/v1/graph/analytics — per-node metrics and cluster data from NetworkX.
     */
    getAnalytics = async (_req: Request, res: Response): Promise<void> => {
        const analytics = await this.fraudGraphService.getGraphAnalytics();
        res.status(200).json(analytics);
    };
}
