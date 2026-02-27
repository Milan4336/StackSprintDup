import { AuditActor, AuditService } from './AuditService';
import { SystemSettingRepository } from '../repositories/SystemSettingRepository';
import { AppError } from '../utils/errors';

export interface UpdateSettingsInput {
  highAmountThreshold?: number;
  velocityWindowMinutes?: number;
  velocityTxThreshold?: number;
  scoreRuleWeight?: number;
  scoreMlWeight?: number;
  scoreBehaviorWeight?: number;
  scoreGraphWeight?: number;
  autonomousAlertThreshold?: number;
  simulationMode?: boolean;
}

export class SettingsService {
  constructor(
    private readonly settingsRepository: SystemSettingRepository,
    private readonly auditService: AuditService
  ) { }

  async get() {
    return this.settingsRepository.getOrCreate();
  }

  async getRuntimeConfig() {
    const setting = await this.settingsRepository.getOrCreate();
    return {
      highAmountThreshold: setting.highAmountThreshold,
      velocityWindowMinutes: setting.velocityWindowMinutes,
      velocityTxThreshold: setting.velocityTxThreshold,
      scoreRuleWeight: setting.scoreRuleWeight,
      scoreMlWeight: setting.scoreMlWeight,
      scoreBehaviorWeight: setting.scoreBehaviorWeight,
      scoreGraphWeight: setting.scoreGraphWeight,
      autonomousAlertThreshold: setting.autonomousAlertThreshold,
      simulationMode: setting.simulationMode
    };
  }

  async update(input: UpdateSettingsInput, actor?: AuditActor) {
    const current = await this.settingsRepository.getOrCreate();
    const nextRuleWeight = input.scoreRuleWeight ?? current.scoreRuleWeight;
    const nextMlWeight = input.scoreMlWeight ?? current.scoreMlWeight;
    const nextBehaviorWeight = input.scoreBehaviorWeight ?? current.scoreBehaviorWeight;
    const nextGraphWeight = input.scoreGraphWeight ?? current.scoreGraphWeight;

    if (Math.abs(nextRuleWeight + nextMlWeight + nextBehaviorWeight + nextGraphWeight - 1) > 0.001) {
      throw new AppError('Weights (Rule + ML + Behavior + Graph) must equal 1', 400);
    }

    const updated = await this.settingsRepository.update({
      ...(input.highAmountThreshold !== undefined ? { highAmountThreshold: input.highAmountThreshold } : {}),
      ...(input.velocityWindowMinutes !== undefined ? { velocityWindowMinutes: input.velocityWindowMinutes } : {}),
      ...(input.velocityTxThreshold !== undefined ? { velocityTxThreshold: input.velocityTxThreshold } : {}),
      ...(input.scoreRuleWeight !== undefined ? { scoreRuleWeight: input.scoreRuleWeight } : {}),
      ...(input.scoreMlWeight !== undefined ? { scoreMlWeight: input.scoreMlWeight } : {}),
      ...(input.scoreBehaviorWeight !== undefined ? { scoreBehaviorWeight: input.scoreBehaviorWeight } : {}),
      ...(input.scoreGraphWeight !== undefined ? { scoreGraphWeight: input.scoreGraphWeight } : {}),
      ...(input.autonomousAlertThreshold !== undefined
        ? { autonomousAlertThreshold: input.autonomousAlertThreshold }
        : {}),
      ...(input.simulationMode !== undefined ? { simulationMode: input.simulationMode } : {}),
      ...(actor?.actorEmail ? { updatedBy: actor.actorEmail } : {})
    });

    await this.auditService.log({
      eventType: 'SETTINGS_UPDATED',
      action: 'update',
      entityType: 'settings',
      entityId: updated.key,
      actor,
      metadata: input as Record<string, unknown>
    });

    return updated;
  }
}
