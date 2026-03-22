import { Request, Response } from 'express';
import { AlertService } from '../services/AlertService';

export class AlertController {
    constructor(private readonly alertService: AlertService) { }

    list = async (req: Request, res: Response): Promise<void> => {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const alerts = await this.alertService.getRecentAlerts(limit);
        res.json(alerts);
    };

    acknowledge = async (req: Request, res: Response): Promise<void> => {
        const id = req.params.id as string;
        const alert = await this.alertService.acknowledgeAlert(id);
        if (!alert) {
            res.status(404).json({ message: 'Alert not found' });
            return;
        }
        res.json(alert);
    };
}
