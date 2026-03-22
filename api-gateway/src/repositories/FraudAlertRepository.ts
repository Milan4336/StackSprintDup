import { FraudAlertDocument, FraudAlertModel } from '../models/FraudAlert';

export class FraudAlertRepository {
  async create(payload: Partial<FraudAlertDocument>): Promise<FraudAlertDocument> {
    return FraudAlertModel.create(payload);
  }

  async findRecent(limit = 100): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }
}
