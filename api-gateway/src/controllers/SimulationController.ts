import { Request, Response } from 'express';
import { SimulationService } from '../services/SimulationService';

export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  start = async (req: Request, res: Response): Promise<void> => {
    const count = Number(req.body?.count ?? 50);
    const result = await this.simulationService.startSimulation(Math.max(1, Math.min(500, count)));
    res.status(200).json(result);
  };
}
