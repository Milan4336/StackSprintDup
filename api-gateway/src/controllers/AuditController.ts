import { Request, Response } from 'express';
import { AuditService } from '../services/AuditService';

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const limit = Number(req.query.limit ?? 200);
    const result = await this.auditService.listRecent(Math.max(1, Math.min(1000, limit)));
    res.status(200).json(result);
  };
}
