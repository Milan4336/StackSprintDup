import { Request, Response } from 'express';
import { MlServiceClient } from '../services/MlServiceClient';
import { ModelMetricsService } from '../services/ModelMetricsService';

export class ModelController {
  constructor(
    private readonly mlServiceClient: MlServiceClient,
    private readonly modelMetricsService: ModelMetricsService
  ) { }

  info = async (_req: Request, res: Response): Promise<void> => {
    const info = await this.mlServiceClient.fetchRemoteModelInfo();
    res.status(200).json(info);
  };

  health = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const [latest, metrics] = await Promise.all([
      this.modelMetricsService.latest(),
      this.modelMetricsService.listRecent(Math.max(1, Math.min(500, limit)))
    ]);
    res.status(200).json({ latest, metrics });
  };

  updateConfig = async (req: Request, res: Response): Promise<void> => {
    const result = await this.mlServiceClient.updateModelConfig(req.body);
    res.status(200).json(result);
  };

  registry = async (req: Request, res: Response): Promise<void> => {
    const modelName = (req.query.modelName as string) || 'xgboost';
    const result = await this.mlServiceClient.getModelRegistry(modelName);
    res.status(200).json(result);
  };

  stats = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.mlServiceClient.getModelStats();
    res.status(200).json(result);
  };

  retrain = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.mlServiceClient.triggerRetrain();
    res.status(200).json(result);
  };
}
