import { Request, Response } from 'express';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { UserDeviceRepository } from '../repositories/UserDeviceRepository';
import { FraudExplanationService } from '../services/FraudExplanationService';

export class MonitoringController {
  constructor(
    private readonly fraudAlertRepository: FraudAlertRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
    private readonly fraudExplanationService: FraudExplanationService
  ) {}

  alerts = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const result = await this.fraudAlertRepository.findRecent(Math.max(1, Math.min(500, limit)));
    res.status(200).json(result);
  };

  devices = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 200);
    const result = await this.userDeviceRepository.findRecent(Math.max(1, Math.min(1000, limit)));
    res.status(200).json(result);
  };

  explanations = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const result = await this.fraudExplanationService.listRecent(Math.max(1, Math.min(500, limit)));
    res.status(200).json(result);
  };
}
