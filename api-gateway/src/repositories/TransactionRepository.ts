import { TransactionModel, TransactionDocument } from '../models/Transaction';

export interface TransactionQueryOptions {
  page: number;
  limit: number;
  search?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  userId?: string;
  deviceId?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'timestamp' | 'amount' | 'fraudScore' | 'riskLevel' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class TransactionRepository {
  async find(query: any = {}, limit = 100): Promise<TransactionDocument[]> {
    return TransactionModel.find(query).limit(limit).sort({ timestamp: -1 });
  }

  async create(payload: Partial<TransactionDocument>): Promise<TransactionDocument> {
    return TransactionModel.create(payload);
  }

  async findByUserWithinWindow(userId: string, from: Date): Promise<TransactionDocument[]> {
    return TransactionModel.find({ userId, timestamp: { $gte: from } }).sort({ timestamp: -1 });
  }

  async findLatestByUser(userId: string): Promise<TransactionDocument | null> {
    return TransactionModel.findOne({ userId }).sort({ timestamp: -1 });
  }

  async findByTransactionId(transactionId: string): Promise<TransactionDocument | null> {
    return TransactionModel.findOne({ transactionId });
  }

  async findByUser(userId: string, limit = 100): Promise<TransactionDocument[]> {
    return TransactionModel.find({ userId }).sort({ timestamp: -1 }).limit(limit);
  }

  async findRecent(limit = 100): Promise<TransactionDocument[]> {
    return TransactionModel.find({}).sort({ timestamp: -1 }).limit(limit);
  }

  async query(options: TransactionQueryOptions): Promise<{
    data: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const query: Record<string, unknown> = {};

    if (options.riskLevel) query.riskLevel = options.riskLevel;
    if (options.userId) query.userId = options.userId;
    if (options.deviceId) query.deviceId = options.deviceId;

    if (options.minAmount !== undefined || options.maxAmount !== undefined) {
      query.amount = {};
      if (options.minAmount !== undefined) {
        (query.amount as { $gte?: number }).$gte = options.minAmount;
      }
      if (options.maxAmount !== undefined) {
        (query.amount as { $lte?: number }).$lte = options.maxAmount;
      }
    }

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        (query.timestamp as { $gte?: Date }).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.timestamp as { $lte?: Date }).$lte = options.endDate;
      }
    }

    if (options.search) {
      const safe = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { transactionId: { $regex: safe, $options: 'i' } },
        { userId: { $regex: safe, $options: 'i' } },
        { deviceId: { $regex: safe, $options: 'i' } },
        { location: { $regex: safe, $options: 'i' } },
        { country: { $regex: safe, $options: 'i' } }
      ];
    }

    const sortBy = options.sortBy ?? 'timestamp';
    const direction = options.sortOrder === 'asc' ? 1 : -1;
    const skip = (Math.max(1, options.page) - 1) * Math.max(1, options.limit);
    const limit = Math.max(1, Math.min(500, options.limit));

    const [data, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ [sortBy]: direction })
        .skip(skip)
        .limit(limit),
      TransactionModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      page: Math.max(1, options.page),
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    };
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

  async fraudByCountry(limit = 10): Promise<Array<{ country: string; fraudCount: number; total: number }>> {
    return TransactionModel.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$country', 'Unknown'] },
          total: { $sum: 1 },
          fraudCount: { $sum: { $cond: ['$isFraud', 1, 0] } }
        }
      },
      { $sort: { fraudCount: -1 } },
      { $limit: limit },
      { $project: { _id: 0, country: '$_id', fraudCount: 1, total: 1 } }
    ]);
  }

  async findLabeledTransactions(limit = 2000): Promise<TransactionDocument[]> {
    // Only return transactions that have been definitely labeled (isFraud is either true or false explicitly)
    // In our system, all transactions have isFraud, but for training we might want to prioritize those 
    // that were reviewed or came from high-confidence sources if applicable.
    // For now, we take the most recent labeled transactions.
    return TransactionModel.find({})
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}
