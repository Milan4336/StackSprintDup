import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { RuleEngineService } from './RuleEngineService';
import { MlServiceClient } from './MlServiceClient';

export class FraudScoringService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly mlServiceClient: MlServiceClient
  ) {}

  private classify(score: number): 'Low' | 'Medium' | 'High' {
    if (score <= 30) return 'Low';
    if (score <= 70) return 'Medium';
    return 'High';
  }

  async score(input: {
    userId: string;
    amount: number;
    location: string;
    deviceId: string;
    timestamp: Date;
  }): Promise<{
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    isFraud: boolean;
    explanations: FraudExplanationItem[];
  }> {
    const ruleScore = await this.ruleEngineService.evaluate(input);

    let mlScore = 0;
    let explanations: FraudExplanationItem[] = [];
    try {
      const mlResult = await this.mlServiceClient.score({
        userId: input.userId,
        amount: input.amount,
        location: input.location,
        deviceId: input.deviceId,
        timestamp: input.timestamp.toISOString()
      });
      mlScore = mlResult.fraudScore;
      explanations = mlResult.explanations ?? [];
    } catch {
      mlScore = 0;
      explanations = [];
    }

    const weighted = ruleScore * env.SCORE_RULE_WEIGHT + mlScore * 100 * env.SCORE_ML_WEIGHT;
    const fraudScore = Math.max(0, Math.min(100, Math.round(weighted)));
    const riskLevel = this.classify(fraudScore);

    return { fraudScore, riskLevel, isFraud: riskLevel === 'High', explanations };
  }
}
