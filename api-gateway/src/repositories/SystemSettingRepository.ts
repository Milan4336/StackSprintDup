import { env } from '../config/env';
import { SystemSettingDocument, SystemSettingModel } from '../models/SystemSetting';

const DEFAULT_KEY = 'fraud-config';

export class SystemSettingRepository {
  async getOrCreate(): Promise<SystemSettingDocument> {
    const existing = await SystemSettingModel.findOne({ key: DEFAULT_KEY });
    if (existing) return existing;

    return SystemSettingModel.create({
      key: DEFAULT_KEY,
      highAmountThreshold: env.HIGH_AMOUNT_THRESHOLD,
      velocityWindowMinutes: env.VELOCITY_WINDOW_MINUTES,
      velocityTxThreshold: env.VELOCITY_TX_THRESHOLD,
      scoreRuleWeight: env.SCORE_RULE_WEIGHT,
      scoreMlWeight: env.SCORE_ML_WEIGHT,
      scoreBehaviorWeight: env.SCORE_BEHAVIOR_WEIGHT,
      scoreGraphWeight: env.SCORE_GRAPH_WEIGHT,
      autonomousAlertThreshold: env.AUTONOMOUS_ALERT_THRESHOLD,
      simulationMode: true
    });
  }

  async update(payload: Partial<SystemSettingDocument>): Promise<SystemSettingDocument> {
    await this.getOrCreate();
    const updated = await SystemSettingModel.findOneAndUpdate({ key: DEFAULT_KEY }, payload, {
      new: true,
      upsert: true
    });

    if (!updated) {
      throw new Error('Failed to update system settings');
    }
    return updated;
  }
}
