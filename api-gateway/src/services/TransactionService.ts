import { TransactionRepository } from '../repositories/TransactionRepository';
import { FraudScoringService } from './FraudScoringService';
import { EventBusService } from './EventBusService';
import { AutonomousResponseService } from './AutonomousResponseService';
import { DeviceFingerprintService } from './DeviceFingerprintService';
import { FraudExplanationService } from './FraudExplanationService';
import { geocodeLocation } from '../utils/geolocation';

export interface CreateTransactionInput {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location: string;
  deviceId: string;
  ipAddress: string;
  timestamp: Date;
}

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly fraudScoringService: FraudScoringService,
    private readonly eventBusService: EventBusService,
    private readonly autonomousResponseService: AutonomousResponseService,
    private readonly deviceFingerprintService: DeviceFingerprintService,
    private readonly fraudExplanationService: FraudExplanationService
  ) {}

  async create(input: CreateTransactionInput) {
    const coordinates = geocodeLocation(input.location);

    const scoring = await this.fraudScoringService.score({
      userId: input.userId,
      amount: input.amount,
      location: input.location,
      deviceId: input.deviceId,
      timestamp: input.timestamp
    });

    const created = await this.transactionRepository.create({
      ...input,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      fraudScore: scoring.fraudScore,
      riskLevel: scoring.riskLevel,
      isFraud: scoring.isFraud,
      explanations: scoring.explanations
    });

    await Promise.all([
      this.fraudExplanationService.save({
        transactionId: created.transactionId,
        userId: created.userId,
        fraudScore: created.fraudScore,
        explanations: scoring.explanations
      }),
      this.deviceFingerprintService.track({
        userId: created.userId,
        deviceId: created.deviceId,
        location: created.location,
        riskLevel: created.riskLevel,
        fraudScore: created.fraudScore,
        timestamp: created.timestamp
      }),
      this.autonomousResponseService.process({
        transactionId: created.transactionId,
        userId: created.userId,
        fraudScore: created.fraudScore,
        riskLevel: created.riskLevel
      })
    ]);

    await this.eventBusService.publishTransactionCreated({
      transactionId: created.transactionId,
      amount: created.amount,
      location: created.location,
      latitude: created.latitude,
      longitude: created.longitude,
      riskLevel: created.riskLevel,
      fraudScore: created.fraudScore,
      timestamp: created.timestamp,
      isFraud: created.isFraud,
      userId: created.userId,
      deviceId: created.deviceId,
      explanations: created.explanations
    });
    return created;
  }

  async list(limit = 100) {
    return this.transactionRepository.findRecent(limit);
  }

  async stats() {
    const [summary, highRiskUsers] = await Promise.all([
      this.transactionRepository.getStats(),
      this.transactionRepository.topHighRiskUsers(5)
    ]);

    return {
      fraudRate: summary.total ? summary.fraudCount / summary.total : 0,
      avgRiskScore: summary.avgScore,
      highRiskUsers
    };
  }
}
