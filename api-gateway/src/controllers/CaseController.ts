import { Request, Response } from 'express';
import { CaseService } from '../services/CaseService';
import { AppError } from '../utils/errors';

export class CaseController {
  constructor(private readonly caseService: CaseService) { }

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await this.caseService.create({
      transactionId: req.body.transactionId,
      alertId: req.body.alertId,
      investigatorId: req.body.investigatorId,
      status: req.body.status,
      priority: req.body.priority,
      notes: req.body.notes,
      actor: {
        actorId: req.user?.sub as string,
        actorEmail: req.user?.email as string,
        ipAddress: req.ip as string
      }
    });
    res.status(201).json(created);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.caseService.list({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 25),
      status: req.query.status as any,
      priority: req.query.priority as any,
      investigatorId: req.query.investigatorId as string,
      transactionId: req.query.transactionId as string
    });
    res.status(200).json(result);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const caseId = req.params.id as string;
    const updated = await this.caseService.updateStatus(
      caseId,
      req.body.status,
      req.body.note,
      {
        actorId: req.user?.sub as string,
        actorEmail: req.user?.email as string,
        ipAddress: req.ip as string
      }
    );

    if (!updated) {
      throw new AppError('Case not found', 404);
    }
    res.status(200).json(updated);
  };

  assign = async (req: Request, res: Response): Promise<void> => {
    const caseId = req.params.id as string;
    const updated = await this.caseService.assignInvestigator(
      caseId,
      req.body.investigatorId,
      {
        actorId: req.user?.sub as string,
        actorEmail: req.user?.email as string,
        ipAddress: req.ip as string
      }
    );

    if (!updated) {
      throw new AppError('Case not found', 404);
    }
    res.status(200).json(updated);
  };

  addEvidence = async (req: Request, res: Response): Promise<void> => {
    const caseId = req.params.id as string;
    const updated = await this.caseService.addEvidence(
      caseId,
      req.body.fileUrl,
      {
        actorId: req.user?.sub as string,
        actorEmail: req.user?.email as string,
        ipAddress: req.ip as string
      }
    );

    if (!updated) {
      throw new AppError('Case not found', 404);
    }
    res.status(200).json(updated);
  };
}
