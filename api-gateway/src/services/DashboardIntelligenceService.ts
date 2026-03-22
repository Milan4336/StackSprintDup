import { realtimeEventBus } from './RealtimeEventBus';
import { TransactionModel } from '../models/Transaction';
import { ThreatIndexHistory } from '../models/ThreatIndexHistory';
import { logger } from '../config/logger';

class DashboardIntelligenceService {
    private cronInterval: NodeJS.Timeout | null = null;

    public startBackgroundWorker() {
        if (this.cronInterval) return;
        logger.info('Starting Dashboard Intelligence Cron Worker...');

        // Run every 10 seconds for real-time demo purposes
        this.cronInterval = setInterval(async () => {
            try {
                await this.computeAndEmitRollingAnalytics();
            } catch (error) {
                logger.error({ error }, 'Error in Dashboard Intelligence Cron');
            }
        }, 10000);
    }

    public stopBackgroundWorker() {
        if (this.cronInterval) {
            clearInterval(this.cronInterval);
            this.cronInterval = null;
        }
    }

    private async computeAndEmitRollingAnalytics() {
        const now = new Date();
        const fifteenMinAgo = new Date(now.getTime() - 15 * 60000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60000);

        // 1. Fetch Transactions
        const recentTxs = await TransactionModel.find({ timestamp: { $gte: oneHourAgo } }).select('fraudScore timestamp').lean();
        const last15MinTx = recentTxs.filter((tx: any) => new Date(tx.timestamp).getTime() >= fifteenMinAgo.getTime());

        // 2. Base Analytics
        const current15MinAvg = last15MinTx.length ? last15MinTx.reduce((sum: number, tx: any) => sum + (tx.fraudScore || 0), 0) / last15MinTx.length : 0;
        const last1HrAvg = recentTxs.length ? recentTxs.reduce((sum: number, tx: any) => sum + (tx.fraudScore || 0), 0) / recentTxs.length : 0;

        let confidenceSum = 0;
        let validScores = 0;
        recentTxs.forEach((tx: any) => {
            if (tx.fraudScore !== undefined) {
                const conf = Math.abs((tx.fraudScore / 100) - 0.5) * 2 * 100;
                confidenceSum += conf;
                validScores++;
            }
        });

        // 3. Drift Calculation (KL Divergence placeholder)
        const klDivergenceVal = validScores > 0 ? (current15MinAvg > 30 ? 0.08 : 0.02) : 0.01;

        // 4. Emit Risk Pulse & Spike
        const riskPulseLevel = Math.min(100, current15MinAvg * 100);
        await realtimeEventBus.publish('system.riskPulse', {
            timestamp: now.toISOString(),
            level: riskPulseLevel,
            trend: current15MinAvg > last1HrAvg ? 'up' : 'down'
        });

        if (current15MinAvg > 1.8 * last1HrAvg && last1HrAvg > 0) {
            await realtimeEventBus.publish('system.spike', {
                detectedAt: now.toISOString(),
                severity: 'Critical',
                ratio: current15MinAvg / last1HrAvg
            });
        }

        // 5. Threat Intelligence Index Formula
        const globalRisk = current15MinAvg;
        const spikeFactor = current15MinAvg > last1HrAvg ? 1.0 : 0.2;
        const driftScore = klDivergenceVal * 2;
        const alertPressure = Math.min(1, last15MinTx.length / 150);

        const rawThreatIndex = (0.4 * globalRisk) + (0.2 * spikeFactor) + (0.2 * driftScore) + (0.2 * alertPressure);
        const threatIndex = (0.7 * last1HrAvg) + (0.3 * rawThreatIndex);

        await ThreatIndexHistory.create({
            score: threatIndex,
            components: { globalRisk, spikeFactor, driftScore, alertPressure }
        });

        await realtimeEventBus.publish('system.threatIndex', {
            score: threatIndex,
            timestamp: now.toISOString()
        });

        // 6. Transactions Velocity
        await realtimeEventBus.publish('velocity.live', {
            currentTps: last15MinTx.length / 900,
            timestamp: now.toISOString()
        });

        // 7. Model Confidence
        const currentConfidence = validScores > 0 ? (confidenceSum / validScores) : 95.0;
        await realtimeEventBus.publish('system.modelConfidence', {
            timestamp: now.toISOString(),
            confidence: currentConfidence,
            trend: currentConfidence > 90 ? 'stable' : 'degraded'
        });

        // 8. Drift Monitor
        await realtimeEventBus.publish('drift.live', {
            timestamp: now.toISOString(),
            klDivergence: klDivergenceVal,
            status: klDivergenceVal > 0.05 ? 'warning' : 'healthy'
        });

        // 9. Risk Forecast
        await realtimeEventBus.publish('risk.forecast', {
            timestamp: now.toISOString(),
            projectedRisk: Math.min(100, current15MinAvg * 100 * 1.1)
        });
    }
}

export const dashboardIntelligenceService = new DashboardIntelligenceService();