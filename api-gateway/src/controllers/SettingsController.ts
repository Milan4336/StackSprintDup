import { Request, Response } from 'express';
import { SettingsService } from '../services/SettingsService';

export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.settingsService.get();
    res.status(200).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.settingsService.update(req.body, {
      actorId: req.user?.sub,
      actorEmail: req.user?.email,
      ipAddress: req.ip
    });
    res.status(200).json(result);
  };
}
