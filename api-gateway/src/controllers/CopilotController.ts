import { NextFunction, Request, Response } from 'express';
import { copilotService } from '../services/CopilotService';
import { logger } from '../config/logger';

export class CopilotController {
    async chat(req: Request, res: Response, _next: NextFunction) {
        try {
            const { message } = req.body;
            if (!message) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            const payload = await copilotService.ask(String(message), {
                userId: req.user?.sub,
                role: req.user?.role
            });

            res.json(payload);
        } catch (error) {
            logger.error({ error }, 'Copilot controller error');
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export const copilotController = new CopilotController();
