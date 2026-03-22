import { env } from '../config/env';
import { TransactionRepository } from '../repositories/TransactionRepository';

interface RuleInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  timestamp: Date;
}

export class RuleEngineService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async evaluate(input: RuleInput): Promise<number> {
    let score = 0;

    if (input.amount >= env.HIGH_AMOUNT_THRESHOLD) {
      score += 40;
    }

    const from = new Date(input.timestamp.getTime() - env.VELOCITY_WINDOW_MINUTES * 60 * 1000);
    const recent = await this.transactionRepository.findByUserWithinWindow(input.userId, from);
    if (recent.length >= env.VELOCITY_TX_THRESHOLD) {
      score += 25;
    }

    const latest = await this.transactionRepository.findLatestByUser(input.userId);
    if (latest && latest.location !== input.location) {
      score += 20;
    }

    if (latest && latest.deviceId !== input.deviceId) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }
}
