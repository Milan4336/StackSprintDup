import { v4 as uuidv4 } from 'uuid';
import { FraudResponseService } from './FraudResponseService';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { TransactionQueryOptions } from '../repositories/TransactionRepository';
import { AlertService } from './AlertService';

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  location: string;
  deviceId: string;
  ipAddress: string;
  currency: string;
  transactionId?: string;
  timestamp?: Date;
  deviceFingerprint?: any;
}


export class TransactionService {

  constructor(
    private readonly transactionRepository: any,
    private readonly fraudScoringService: any,
    private readonly eventBusService: any,
    private readonly fraudResponseService: FraudResponseService,
    private readonly deviceFingerprintService: any,
    private readonly deviceIntelligenceService: any,
    private readonly fraudExplanationService: any,
    private readonly geoService: any,
    private readonly auditService: any,
    private readonly modelMetricsService: any,
    private readonly alertService: AlertService
  ) { }

  async create(input: CreateTransactionInput) {
    let deviceLabel = 'Unknown';
    if (input.deviceFingerprint && this.deviceIntelligenceService) {
      const dev = await this.deviceIntelligenceService.evaluateDevice(input.userId, input.deviceFingerprint);
      deviceLabel = dev?.deviceLabel || 'Unknown';
    }

    const enrichedInput = {
      ...input,
      deviceLabel,
      timestamp: input.timestamp || new Date()
    };

    const scoring = await this.fraudScoringService.score(enrichedInput);

    const transaction = await this.transactionRepository.create({
      transactionId: input.transactionId ?? uuidv4(),
      ...enrichedInput,
      // Full scoring result — all fields required by the Mongoose schema
      fraudScore: scoring.fraudScore,
      riskLevel: scoring.riskLevel,
      isFraud: scoring.isFraud,
      action: scoring.action,
      ruleScore: scoring.ruleScore,
      mlScore: scoring.mlScore,
      mlStatus: scoring.mlStatus,
      behaviorScore: scoring.behaviorScore,
      graphScore: scoring.graphScore,
      modelName: scoring.modelName,
      modelVersion: scoring.modelVersion,
      modelConfidence: scoring.modelConfidence,
      modelScores: scoring.modelScores,
      modelWeights: scoring.modelWeights,
      geoVelocityFlag: scoring.geoVelocityFlag,
      ruleReasons: scoring.ruleReasons ?? [],
      explanations: scoring.explanations ?? [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await this.fraudResponseService.process({
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      fraudScore: transaction.fraudScore,
      deviceId: transaction.deviceId,
      ipAddress: transaction.ipAddress,
      location: transaction.location,
      ruleReasons: scoring.ruleReasons ?? [],
      explanations: scoring.explanations ?? []
    });

    // Phase 9: Evaluate Alerting Rules
    await this.alertService.evaluateRules(transaction as any, transaction.fraudScore, transaction.ruleReasons || []);

    return transaction;
  }

  async list(limit = 50) {
    return this.transactionRepository.findRecent(limit);
  }

  async query(query: TransactionQueryOptions) {
    return this.transactionRepository.query(query);
  }

  async findByTransactionId(transactionId: string) {
    return this.transactionRepository.findByTransactionId(transactionId);
  }

  async stats() {
    return this.transactionRepository.stats();
  }

  async getTrainingData(limit = 2000) {
    return this.transactionRepository.findLabeledTransactions(limit);
  }

  async verifyZeroTrust(transactionId: string, payload: { otpCode: string; biometricToken: string; deviceToken: string }) {
    const transaction = await this.transactionRepository.findByTransactionId(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    if (transaction.verificationStatus !== 'PENDING') {
      throw new Error('Transaction is not pending verification');
    }

    // In a real scenario, we would validate the tokens here.
    // For this simulation, we assume if the tokens are provided, verification passes.
    if (!payload.otpCode || !payload.biometricToken || !payload.deviceToken) {
      transaction.verificationStatus = 'FAILED';
      transaction.action = 'BLOCK';
      await transaction.save();

      await this.fraudResponseService.process({
        transactionId: transaction.transactionId,
        userId: transaction.userId,
        fraudScore: transaction.fraudScore,
        deviceId: transaction.deviceId,
        ipAddress: transaction.ipAddress,
        location: transaction.location,
        ruleReasons: transaction.ruleReasons ?? [],
        explanations: transaction.explanations ?? []
      });

      throw new Error('Verification failed due to missing tokens');
    }

    transaction.verificationStatus = 'VERIFIED';
    transaction.action = 'ALLOW';
    await transaction.save();

    return transaction;
  }
}
