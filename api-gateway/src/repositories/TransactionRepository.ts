import { TransactionModel, TransactionDocument } from '../models/Transaction';

export class TransactionRepository {
  async create(payload: Partial<TransactionDocument>): Promise<TransactionDocument> {
    return TransactionModel.create(payload);
  }

  async findByUserWithinWindow(userId: string, from: Date): Promise<TransactionDocument[]> {
    return TransactionModel.find({ userId, timestamp: { $gte: from } }).sort({ timestamp: -1 });
  }

  async findLatestByUser(userId: string): Promise<TransactionDocument | null> {
    return TransactionModel.findOne({ userId }).sort({ timestamp: -1 });
  }

  async findRecent(limit = 100): Promise<TransactionDocument[]> {
    return TransactionModel.find({}).sort({ timestamp: -1 }).limit(limit);
  }

  async getStats(): Promise<{ total: number; fraudCount: number; avgScore: number }> {
    const [result] = await TransactionModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } },
          avgScore: { $avg: '$fraudScore' }
        }
      }
    ]);
    return {
      total: result?.total ?? 0,
      fraudCount: result?.fraudCount ?? 0,
      avgScore: result?.avgScore ?? 0
    };
  }

  async topHighRiskUsers(limit = 5): Promise<Array<{ userId: string; count: number }>> {
    return TransactionModel.aggregate([
      { $match: { riskLevel: 'High' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, userId: '$_id', count: 1 } }
    ]);
  }
}
