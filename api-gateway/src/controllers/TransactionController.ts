import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';
import { AppError } from '../utils/errors';

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  private toDate(raw: unknown): Date | undefined {
    if (!raw) return undefined;
    const next = new Date(String(raw));
    return Number.isNaN(next.getTime()) ? undefined : next;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    let fp = req.body.deviceFingerprint;
    if (!fp && req.headers['x-device-fingerprint']) {
      try {
        fp = JSON.parse(Buffer.from(req.headers['x-device-fingerprint'] as string, 'base64').toString('ascii'));
      } catch (e) { }
    }

    const created = await this.transactionService.create({
      ...req.body,
      deviceFingerprint: fp,
      timestamp: new Date(req.body.timestamp)
    });
    res.status(201).json(created);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const result = await this.transactionService.list(limit);
    res.status(200).json(result);
  };

  query = async (req: Request, res: Response): Promise<void> => {
    const result = await this.transactionService.query({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 25),
      search: (req.query.search as string | undefined) ?? undefined,
      riskLevel: req.query.riskLevel as 'Low' | 'Medium' | 'High' | undefined,
      userId: req.query.userId as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      minAmount: req.query.minAmount !== undefined ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount !== undefined ? Number(req.query.maxAmount) : undefined,
      startDate: this.toDate(req.query.startDate),
      endDate: this.toDate(req.query.endDate),
      sortBy: req.query.sortBy as 'timestamp' | 'amount' | 'fraudScore' | 'riskLevel' | 'createdAt' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined
    });
    res.status(200).json(result);
  };

  byId = async (req: Request, res: Response): Promise<void> => {
    const result = await this.transactionService.findByTransactionId(req.params.transactionId as string);
    if (!result) {
      throw new AppError('Transaction not found', 404);
    }
    res.status(200).json(result);
  };

  stats = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.transactionService.stats();
    res.status(200).json(result);
  };

  getTrainingData = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 2000);
    const result = await this.transactionService.getTrainingData(limit);
    res.status(200).json(result);
  };

  verifyZeroTrust = async (req: Request, res: Response): Promise<void> => {
    try {
      const { otpCode, biometricToken, deviceToken } = req.body;
      const result = await this.transactionService.verifyZeroTrust(req.params.transactionId as string, {
        otpCode,
        biometricToken,
        deviceToken
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
