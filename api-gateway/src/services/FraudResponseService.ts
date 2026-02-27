import { v4 as uuidv4 } from 'uuid';
import { FraudExplanationItem } from '../models/FraudExplanation';
import { FraudAlertRepository } from '../repositories/FraudAlertRepository';
import { EventBusService } from './EventBusService';
import { SettingsService } from './SettingsService';
import { AuditService } from './AuditService';
import { UserModel } from '../models/User';

export interface FraudResponseInput {
    transactionId: string;
    userId: string;
    fraudScore: number;
    location?: string;
    ruleReasons?: string[];
    explanations?: FraudExplanationItem[];
}

export class FraudResponseService {
    constructor(
        private readonly fraudAlertRepository: FraudAlertRepository,
        private readonly eventBusService: EventBusService,
        private readonly settingsService: SettingsService,
        private readonly auditService: AuditService,
        private readonly thresholdMedium = 40,
        private readonly thresholdHigh = 75,
        private readonly thresholdCritical = 90
    ) { }

    async process(input: FraudResponseInput) {
        const { fraudScore, userId, transactionId } = input;

        let actionTaken = 'NONE';
        let newStatus: 'ACTIVE' | 'RESTRICTED' | 'FROZEN' = 'ACTIVE';

        if (fraudScore >= this.thresholdCritical) {
            actionTaken = 'PERMANENT_FREEZE';
            newStatus = 'FROZEN';
        } else if (fraudScore >= this.thresholdHigh) {
            actionTaken = 'TEMPORARY_FREEZE';
            newStatus = 'FROZEN';
        } else if (fraudScore >= this.thresholdMedium) {
            actionTaken = 'REQUIRE_OTP_VERIFICATION';
            newStatus = 'RESTRICTED';
        }

        // Update User Status if necessary
        if (newStatus !== 'ACTIVE') {
            await UserModel.findOneAndUpdate({ userId }, { status: newStatus });

            await this.auditService.log({
                eventType: 'user.account.status_changed',
                action: 'update',
                entityType: 'user',
                entityId: userId,
                metadata: {
                    previousStatus: 'ACTIVE',
                    newStatus,
                    reason: `Fraud score ${fraudScore} above threshold`,
                    transactionId
                }
            });
        }

        // Create Alert if score is high enough
        if (fraudScore >= this.thresholdMedium) {
            const alert = await this.fraudAlertRepository.create({
                alertId: uuidv4(),
                transactionId,
                userId,
                fraudScore,
                riskLevel: fraudScore >= this.thresholdHigh ? 'High' : 'Medium',
                reason: `Autonomous response: ${actionTaken}. Detected anomalies in behavior/ML/rules.`,
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await this.eventBusService.publishFraudAlert(alert);
        }

        return { actionTaken, newStatus };
    }
}
