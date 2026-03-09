import { env } from '../config/env';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { RuleEngineService } from './RuleEngineService';
import { MlServiceClient } from './MlServiceClient';
import { SettingsService } from './SettingsService';

export class FraudScoringService {
  constructor(
    private readonly ruleEngineService: RuleEngineService,
    private readonly mlServiceClient: MlServiceClient,
    private readonly settingsService: SettingsService,
    private readonly userBehaviorService: any,
    private readonly fraudGraphService: any
  ) { }

  private classify(score: number): 'Low' | 'Medium' | 'High' {
    if (score <= 30) return 'Low';
    if (score <= 70) return 'Medium';
    return 'High';
  }

  private responseAction(score: number): 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK' {
    if (score >= 71) return 'BLOCK';
    if (score >= 31) return 'STEP_UP_AUTH';
    return 'ALLOW';
  }

  async score(input: {
    userId: string;
    amount: number;
    location: string;
    deviceId: string;
    ipAddress: string;
    deviceLabel?: string;
    latitude?: number;
    longitude?: number;
    timestamp: Date;
  }): Promise<{
    fraudScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    isFraud: boolean;
    action: 'ALLOW' | 'STEP_UP_AUTH' | 'BLOCK';
    ruleScore: number;
    mlScore: number;
    mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
    modelVersion: string;
    modelName: string;
    modelConfidence: number;
    modelScores?: Record<string, number>;
    modelWeights?: Record<string, number>;
    behaviorScore: number;
    graphScore: number;
    explanations: FraudExplanationItem[];
    ruleReasons: string[];
    geoVelocityFlag: boolean;
    verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  }> {
    const ruleEvaluation = await this.ruleEngineService.evaluate(input);
    const runtimeConfig = await this.settingsService.getRuntimeConfig();
    const ruleScore = ruleEvaluation.score;

    let mlScore = 0;
    let mlConfidence = 0;
    let mlModelScores = {};
    let mlWeights = {};
    let explanations: FraudExplanationItem[] = [];
    let mlStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' = this.mlServiceClient.getStatus().status;

    try {
      const mlResult = await this.mlServiceClient.score({
        userId: input.userId,
        amount: input.amount,
        location: input.location,
        deviceId: input.deviceId,
        timestamp: input.timestamp.toISOString()
      });
      mlScore = mlResult.fraudScore;
      mlConfidence = mlResult.confidence ?? 0;
      mlModelScores = mlResult.modelScores ?? {};
      mlWeights = mlResult.modelWeights ?? {};
      explanations = mlResult.explanations ?? [];
      mlStatus = this.mlServiceClient.getStatus().status;

      const [behaviorScore, graphScore] = await Promise.all([
        this.userBehaviorService.updateProfileAndGetDeviation(input).catch(() => 0),
        this.fraudGraphService.updateGraphAndGetAnomaly(input).catch(() => 0)
      ]);

      // BANK-GRADE WEIGHTED FUSION (Using Configurable Weights)
      let combinedScore = (
        (ruleScore * runtimeConfig.scoreRuleWeight) +
        (mlScore * 100 * runtimeConfig.scoreMlWeight) +
        (behaviorScore * 100 * runtimeConfig.scoreBehaviorWeight) +
        (graphScore * 100 * runtimeConfig.scoreGraphWeight)
      );

      // Device Intelligence Context Modifier
      if (input.deviceLabel === 'New Device' && input.amount > 1000) {
        combinedScore = Math.min(100, combinedScore + 20); // Spike probability threshold
        ruleEvaluation.reasons.push('High-value transaction originating from an untrusted New Device');
      }

      const finalFraudScore = Math.round(combinedScore);

      let action = this.responseAction(finalFraudScore);
      let verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED' = 'NOT_REQUIRED';

      // Zero Trust Trigger condition
      if (
        finalFraudScore > 70 &&
        input.amount > runtimeConfig.highAmountThreshold &&
        input.deviceLabel === 'New Device'
      ) {
        action = 'STEP_UP_AUTH';
        verificationStatus = 'PENDING';
        ruleEvaluation.reasons.push('Zero Trust Triggered: High score + new device + high amount.');
      } else if (action === 'BLOCK') {
        verificationStatus = 'FAILED';
      } else if (action === 'STEP_UP_AUTH') {
        verificationStatus = 'PENDING';
      }

      return {
        fraudScore: finalFraudScore,
        riskLevel: this.classify(finalFraudScore),
        isFraud: finalFraudScore >= 70,
        action,
        verificationStatus,
        ruleScore,
        mlScore,
        behaviorScore,
        graphScore,
        mlStatus,
        modelVersion: env.MODEL_VERSION,
        modelName: env.MODEL_NAME,
        modelConfidence: mlConfidence,
        modelScores: mlModelScores,
        modelWeights: mlWeights,
        explanations,
        ruleReasons: ruleEvaluation.reasons,
        geoVelocityFlag: ruleEvaluation.geoVelocityFlag
      };
    } catch (error) {
      mlStatus = this.mlServiceClient.getStatus().status;
      const [behaviorScore, graphScore] = await Promise.all([
        this.userBehaviorService.updateProfileAndGetDeviation(input).catch(() => 0),
        this.fraudGraphService.updateGraphAndGetAnomaly(input).catch(() => 0)
      ]);

      // Fallback Strategy: Distribute missing ML weight proportionally to Rules, Behavior, and Graph
      // Original: 20/40/25/15. If ML (40) is out, ratio is 20:25:15
      // Sum = 60. New Weights: R: 20/60=0.33, B: 25/60=0.42, G: 15/60=0.25
      const sumOthers = runtimeConfig.scoreRuleWeight + runtimeConfig.scoreBehaviorWeight + runtimeConfig.scoreGraphWeight;
      const fallbackRuleWeight = runtimeConfig.scoreRuleWeight / sumOthers;
      const fallbackBehaviorWeight = runtimeConfig.scoreBehaviorWeight / sumOthers;
      const fallbackGraphWeight = runtimeConfig.scoreGraphWeight / sumOthers;

      const fallbackScore = Math.round(
        (ruleScore * fallbackRuleWeight) +
        (behaviorScore * 100 * fallbackBehaviorWeight) +
        (graphScore * 100 * fallbackGraphWeight)
      );

      let action = this.responseAction(fallbackScore);
      let verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED' = 'NOT_REQUIRED';

      if (
        fallbackScore > 70 &&
        input.amount > runtimeConfig.highAmountThreshold &&
        input.deviceLabel === 'New Device'
      ) {
        action = 'STEP_UP_AUTH';
        verificationStatus = 'PENDING';
        ruleEvaluation.reasons.push('Zero Trust Triggered: High score + new device + high amount.');
      } else if (action === 'BLOCK') {
        verificationStatus = 'FAILED';
      } else if (action === 'STEP_UP_AUTH') {
        verificationStatus = 'PENDING';
      }

      return {
        fraudScore: fallbackScore,
        riskLevel: this.classify(fallbackScore),
        isFraud: fallbackScore >= 70,
        action,
        verificationStatus,
        ruleScore,
        mlScore: 0,
        behaviorScore,
        graphScore,
        mlStatus,
        modelVersion: env.MODEL_VERSION,
        modelName: env.MODEL_NAME,
        modelConfidence: 0,
        modelScores: {},
        modelWeights: {},
        explanations: [],
        ruleReasons: ruleEvaluation.reasons,
        geoVelocityFlag: ruleEvaluation.geoVelocityFlag
      };
    }
  }
}
