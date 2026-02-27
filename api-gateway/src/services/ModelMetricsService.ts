import { ModelMetricRepository } from '../repositories/ModelMetricRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';

export class ModelMetricsService {
  private lastRecordedAt = 0;
  private readonly minSnapshotIntervalMs = 60 * 1000;

  constructor(
    private readonly modelMetricRepository: ModelMetricRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly mlServiceClient: any
  ) { }

  async recordSnapshotIfDue(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRecordedAt < this.minSnapshotIntervalMs) {
      return;
    }
    this.lastRecordedAt = now;

    const recent = await this.transactionRepository.findRecent(500);
    if (recent.length === 0) {
      return;
    }

    const total = recent.length;
    const fraudCount = recent.filter((tx) => tx.isFraud).length;
    const avgFraudScore = recent.reduce((sum, tx) => sum + tx.fraudScore, 0) / total;
    const low = recent.filter((tx) => tx.riskLevel === 'Low').length;
    const medium = recent.filter((tx) => tx.riskLevel === 'Medium').length;
    const high = recent.filter((tx) => tx.riskLevel === 'High').length;

    const avgAmount = recent.reduce((sum, tx) => sum + tx.amount, 0) / total;
    const uniqueDevices = new Set(recent.map((tx) => tx.deviceId)).size;
    const uniqueLocations = new Set(recent.map((tx) => tx.location)).size;
    const fraudRate = fraudCount / total;

    const previous = await this.modelMetricRepository.findLatest();
    const driftDetected =
      previous !== null &&
      (Math.abs(previous.fraudRate - fraudRate) > 0.15 || Math.abs(previous.avgFraudScore - avgFraudScore) > 15);

    await this.modelMetricRepository.create({
      snapshotAt: new Date(),
      fraudRate,
      avgFraudScore,
      scoreDistribution: { low, medium, high },
      inputDistribution: { avgAmount, uniqueDevices, uniqueLocations },
      driftDetected,
      driftReason: driftDetected
        ? 'Distribution shift detected in fraud rate/score compared to previous snapshot.'
        : undefined
    });

    if (driftDetected) {
      console.log('[MODEL_HEALTH] Drift detected. Triggering autonomous retraining pipeline...');
      try {
        await this.mlServiceClient.triggerRetrain();
      } catch (err) {
        console.error('[MODEL_HEALTH] Failed to trigger autonomous retrain:', err);
      }
    }
  }

  async listRecent(limit = 100) {
    return this.modelMetricRepository.findRecent(Math.max(1, Math.min(500, limit)));
  }

  async latest() {
    return this.modelMetricRepository.findLatest();
  }
}
