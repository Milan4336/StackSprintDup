import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, password, role } = req.body;
    const result = await this.authService.register(email, password, role);
    res.status(201).json(result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    res.status(200).json(result);
  };
}
