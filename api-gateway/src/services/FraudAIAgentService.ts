import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { CaseRepository } from '../repositories/CaseRepository';
import { FraudScoringService } from './FraudScoringService';
import { logger } from '../config/logger';
import { realtimeEventBus } from './RealtimeEventBus';

export class FraudAIAgentService {
    private isRunning = false;
    private interval: NodeJS.Timeout | null = null;

    constructor(
        private readonly alertRepository: FraudAlertRepository,
        private readonly caseRepository: CaseRepository,
        private readonly scoringService: FraudScoringService,
        private readonly eventBus: any
    ) { }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        logger.info('Autonomous Fraud AI Agent started');

        // Run triage every 10 seconds
        this.interval = setInterval(() => this.runTriage(), 10000);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.isRunning = false;
    }

    private async runTriage() {
        try {
            const openAlerts = await this.alertRepository.findRecent(20);
            const targets = openAlerts.filter(a => a.status === 'open');

            for (const alert of targets) {
                // AI Decision Logic
                if (alert.fraudScore < 15) {
                    await this.autoClose(alert, 'Low risk profile, autonomous resolution.');
                } else if (alert.fraudScore > 85) {
                    await this.autoEscalate(alert, 'Critical threat detected, immediate intervention required.');
                }
            }
        } catch (error) {
            logger.error({ error }, 'AIAgent triage loop failed');
        }
    }

    private async autoClose(alert: any, reason: string) {
        logger.info({ alertId: alert.alertId }, 'AI Agent auto-closing alert');
        alert.status = 'resolved';
        alert.resolution = 'AUTONOMOUS_CLOSE';
        alert.notes = alert.notes || [];
        alert.notes.push(`[AI Agent] ${reason}`);
        await alert.save();

        this.eventBus.publish('fraud.alerts.update', { alertId: alert.alertId, status: 'resolved' });
    }

    private async autoEscalate(alert: any, reason: string) {
        logger.info({ alertId: alert.alertId }, 'AI Agent auto-escalating alert');

        // Check if case already exists
        const cases = await this.caseRepository.list({ transactionId: alert.transactionId, page: 1, limit: 1 });
        if (cases.data.length === 0) {
            await this.caseRepository.create({
                caseId: `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                transactionId: alert.transactionId,
                alertId: alert.alertId,
                caseStatus: 'UNDER_INVESTIGATION',
                priority: 'CRITICAL',
                investigatorId: 'AI_AGENT',
                caseNotes: [`[AI Agent Escalation] ${reason}`]
            });

            alert.status = 'investigating';
            await alert.save();

            this.eventBus.publish('fraud.alerts.update', { alertId: alert.alertId, status: 'investigating' });
        }
    }

    async getAgentStatus() {
        return {
            active: this.isRunning,
            version: 'v1.2.0-autonomous',
            capabilities: ['AUTO_TRIAGE', 'LINK_ANALYSIS', 'ANOMALY_ESCALATION'],
            lastDecision: new Date().toISOString()
        };
    }
}
