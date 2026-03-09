import { AlertModel, AlertSeverity } from '../models/Alert';
import { TransactionDocument } from '../models/Transaction';
import { realtimeEventBus } from './RealtimeEventBus';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export class AlertService {
    constructor() { }

    async evaluateRules(tx: TransactionDocument, fraudScore: number, reasons: string[]): Promise<void> {
        let severity: AlertSeverity | null = null;

        // Rule 1: fraudScore > 0.9 -> CRITICAL
        if (fraudScore > 0.9) {
            severity = 'CRITICAL';
        }
        // Rule 2: Multiple fraud indicators -> HIGH
        else if (reasons.length >= 3 || fraudScore > 0.75) {
            severity = 'HIGH';
        }
        // Rule 3: Moderate risk -> MEDIUM
        else if (fraudScore > 0.5) {
            severity = 'MEDIUM';
        }

        if (severity) {
            await this.createAlert(tx, fraudScore, severity, reasons);
        }
    }

    private async createAlert(tx: TransactionDocument, fraudScore: number, severity: AlertSeverity, reasons: string[]) {
        const alertId = `ALT-${uuidv4().substring(0, 8).toUpperCase()}`;

        const alertData = {
            alertId,
            transactionId: tx.transactionId,
            userId: tx.userId,
            fraudScore,
            severity,
            status: 'OPEN' as const,
            channels: [],
            payload: {
                amount: tx.amount,
                location: tx.location,
                deviceHash: tx.deviceId,
                timestamp: tx.timestamp,
                reasons
            }
        };

        try {
            const alert = await AlertModel.create(alertData);

            // Notify via channels
            const notifiedChannels = await this.dispatchAlert(alert);
            alert.channels = notifiedChannels;
            await alert.save();

            // Emit via WebSocket
            await realtimeEventBus.publish('fraud.alerts', alert);

            logger.info(`Alert ${alertId} triggered with severity ${severity}`);
        } catch (error) {
            logger.error(`Failed to create alert: ${error}`);
        }
    }

    private async dispatchAlert(alert: any): Promise<string[]> {
        const channels: string[] = [];

        // 1. Slack (Stub)
        logger.info(`[ALERT-SLACK] [${alert.severity}] Alert ${alert.alertId} for User ${alert.userId}. Score: ${alert.fraudScore}`);
        channels.push('slack');

        // 2. Email (Stub)
        logger.info(`[ALERT-EMAIL] Sending alert ${alert.alertId} to security team...`);
        channels.push('email');

        // 3. SMS (Stub)
        if (alert.severity === 'CRITICAL') {
            logger.info(`[ALERT-SMS] Critical alert ${alert.alertId} sent to on-call engineer.`);
            channels.push('sms');
        }

        // 4. Webhook (Live if configured)
        const webhookUrl = process.env.ALERT_WEBHOOK_URL;
        if (webhookUrl) {
            try {
                await axios.post(webhookUrl, alert);
                channels.push('webhook');
            } catch (err) {
                logger.error(`Webhook delivery failed: ${err}`);
            }
        }

        return channels;
    }

    async getRecentAlerts(limit = 20) {
        return AlertModel.find().sort({ createdAt: -1 }).limit(limit);
    }

    async acknowledgeAlert(alertId: string) {
        return AlertModel.findOneAndUpdate(
            { alertId },
            { status: 'ACKNOWLEDGED' },
            { new: true }
        );
    }
}
