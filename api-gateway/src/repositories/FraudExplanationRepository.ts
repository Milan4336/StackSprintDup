import { FraudExplanationDocument, FraudExplanationModel } from '../models/FraudExplanation';

export class FraudExplanationRepository {
  async create(payload: Partial<FraudExplanationDocument>): Promise<FraudExplanationDocument> {
    return FraudExplanationModel.create(payload);
  }

  async findRecent(limit = 100): Promise<FraudExplanationDocument[]> {
    return FraudExplanationModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }

  async findByTransactionId(transactionId: string): Promise<FraudExplanationDocument | null> {
    return FraudExplanationModel.findOne({ transactionId }).sort({ createdAt: -1 });
  }

  async findByUser(userId: string, limit = 50): Promise<FraudExplanationDocument[]> {
    return FraudExplanationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }
}
