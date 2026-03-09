import { Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CaseRepository } from '../repositories/CaseRepository';
import { UserDeviceRepository } from '../repositories/UserDeviceRepository';
import { FraudExplanationService } from '../services/FraudExplanationService';
import { Device } from '../models/Device';

export class MonitoringController {
  constructor(
    private readonly fraudAlertRepository: FraudAlertRepository,
    private readonly userDeviceRepository: UserDeviceRepository,
    private readonly fraudExplanationService: FraudExplanationService,
    private readonly transactionRepository: TransactionRepository,
    private readonly caseRepository: CaseRepository
  ) { }

  alerts = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 100);
    const status = req.query.status as 'open' | 'investigating' | 'resolved' | undefined;
    const search = req.query.search as string | undefined;

    if (req.query.page || req.query.status || req.query.search) {
      const result = await this.fraudAlertRepository.list({
        page: Math.max(1, page),
        limit: Math.max(1, Math.min(500, limit)),
        status,
        search
      });
      res.status(200).json(result);
      return;
    }

    const result = await this.fraudAlertRepository.findRecent(Math.max(1, Math.min(500, limit)));
    res.status(200).json(result);
  };

  alertDetails = async (req: Request, res: Response): Promise<void> => {
    const alertId = req.params.alertId as string;
    const alert = await this.fraudAlertRepository.findByAlertId(alertId);

    if (!alert) {
      throw new AppError('Alert not found', 404);
    }

    const tx = await this.transactionRepository.findByTransactionId(alert.transactionId);
    const userId = tx?.userId ?? alert.userId;

    const [history, devices, explanations, relatedCases] = await Promise.all([
      this.transactionRepository.findByUser(userId, 30),
      this.userDeviceRepository.findByUser(userId, 30),
      this.fraudExplanationService.findByUser(userId, 20),
      this.caseRepository.list({ page: 1, limit: 20, transactionId: alert.transactionId })
    ]);

    res.status(200).json({
      alert,
      transaction: tx,
      userHistory: history,
      devices,
      explanations,
      cases: relatedCases.data
    });
  };

  devices = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 200);
    const result = await this.userDeviceRepository.findRecent(Math.max(1, Math.min(1000, limit)));
    res.status(200).json(result);
  };

  deviceIntelligence = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 50);
    const result = await Device.find({}).sort({ lastSeen: -1 }).limit(Math.max(1, Math.min(200, limit)));
    res.status(200).json(result);
  };

  explanations = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const result = await this.fraudExplanationService.listRecent(Math.max(1, Math.min(500, limit)));
    res.status(200).json(result);
  };
}
