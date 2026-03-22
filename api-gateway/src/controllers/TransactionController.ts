import { Request, Response } from 'express';
import { TransactionService } from '../services/TransactionService';

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await this.transactionService.create({
      ...req.body,
      timestamp: new Date(req.body.timestamp)
    });
    res.status(201).json(created);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 100);
    const result = await this.transactionService.list(limit);
    res.status(200).json(result);
  };

  stats = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.transactionService.stats();
    res.status(200).json(result);
  };
}
