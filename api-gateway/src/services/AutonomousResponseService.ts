import { v4 as uuidv4 } from 'uuid';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { EventBusService } from './EventBusService';

export class AutonomousResponseService {
  constructor(
    private readonly fraudAlertRepository: FraudAlertRepository,
    private readonly eventBusService: EventBusService,
    private readonly threshold = 80
  ) {}

  async process(input: {
    transactionId: string;
    userId: string;
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  }): Promise<void> {
    if (input.fraudScore < this.threshold) {
      return;
    }

    const alert = await this.fraudAlertRepository.create({
      alertId: uuidv4(),
      transactionId: input.transactionId,
      userId: input.userId,
      fraudScore: input.fraudScore,
      riskLevel: input.riskLevel,
      reason: `Autonomous response triggered at score ${input.fraudScore}`,
      status: 'open'
    });

    await this.eventBusService.publishFraudAlert({
      alertId: alert.alertId,
      transactionId: alert.transactionId,
      userId: alert.userId,
      fraudScore: alert.fraudScore,
      riskLevel: alert.riskLevel,
      reason: alert.reason,
      status: alert.status,
      createdAt: alert.createdAt
    });
  }
}
