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
        const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
        const oneHourAgo = new Date(now.getTime() - 60 * 60000);

        // 1. Live Risk Pulse (0-100) & Spike Detection
        const recentTxs = await TransactionModel.find({ timestamp: { $gte: oneHourAgo } }).select('fraudScore timestamp').lean();

        const last5MinTx = recentTxs.filter((tx: any) => new Date(tx.timestamp).getTime() >= fiveMinAgo.getTime());

        const current5MinAvg = last5MinTx.length ? last5MinTx.reduce((sum: number, tx: any) => sum + (tx.fraudScore || 0), 0) / last5MinTx.length : 0;
        const last1HrAvg = recentTxs.length ? recentTxs.reduce((sum: number, tx: any) => sum + (tx.fraudScore || 0), 0) / recentTxs.length : 0;

        const riskPulseLevel = Math.min(100, current5MinAvg * 100);
        await realtimeEventBus.publish('system.riskPulse', {
            timestamp: now.toISOString(),
            level: riskPulseLevel,
            trend: current5MinAvg > last1HrAvg ? 'up' : 'down'
        });

        // Spike Detection
        if (current5MinAvg > 1.8 * last1HrAvg && last1HrAvg > 0) {
            await realtimeEventBus.publish('system.spike', {
                detectedAt: now.toISOString(),
                severity: 'Critical',
                ratio: current5MinAvg / last1HrAvg
            });
        }

        // 2. Threat Intelligence Index Formula
        // 0.4 * globalRisk + 0.2 * spikeFactor + 0.2 * driftScore + 0.2 * alertPressure
        const globalRisk = current5MinAvg; // scale 0-1
        const spikeFactor = current5MinAvg > last1HrAvg ? 1.0 : 0.2;
        const driftScore = 0.1; // Placeholder for KL divergence
        const alertPressure = 0.5; // Placeholder

        const threatIndex = (0.4 * globalRisk) + (0.2 * spikeFactor) + (0.2 * driftScore) + (0.2 * alertPressure);

        await ThreatIndexHistory.create({
            score: threatIndex,
            components: { globalRisk, spikeFactor, driftScore, alertPressure }
        });

        await realtimeEventBus.publish('system.threatIndex', {
            score: threatIndex,
            timestamp: now.toISOString()
        });

        // 3. Transactions Velocity
        await realtimeEventBus.publish('velocity.live', {
            currentTps: last5MinTx.length / 300, // tx per second over 5 min
            timestamp: now.toISOString()
        });

        // ... Implement remaining publishers (modelConfidence, geoLive, collusion etc) as needed
    }
}

export const dashboardIntelligenceService = new DashboardIntelligenceService();
