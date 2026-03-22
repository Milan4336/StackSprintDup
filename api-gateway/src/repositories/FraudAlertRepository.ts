import { FraudAlertDocument, FraudAlertModel } from '../models/FraudAlert';

export class FraudAlertRepository {
  async find(query: any = {}, limit = 100): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find(query).limit(limit).sort({ createdAt: -1 });
  }

  async create(payload: Partial<FraudAlertDocument>): Promise<FraudAlertDocument> {
    return FraudAlertModel.create(payload);
  }

  async findRecent(limit = 100): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find({})
      .limit(Number(limit))
      .exec();
  }

  async findByUser(userId: string, limit = 50): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find({ userId })
      .limit(Number(limit))
      .exec();
  }

  async findAll(limit = 100, skip = 0): Promise<FraudAlertDocument[]> {
    return FraudAlertModel.find({})
      .skip(Number(skip))
      .limit(Number(limit))
      .exec();
  }

  async list(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{ data: FraudAlertDocument[]; total: number; page: number; limit: number; pages: number }> {

    const page = Math.max(1, Number(options.page ?? 1));
    const limit = Math.max(1, Math.min(500, Number(options.limit ?? 100)));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options.status) {
      query.status = options.status;
    }

    if (options.search) {
      query.$or = [
        { transactionId: { $regex: options.search, $options: 'i' } },
        { userId: { $regex: options.search, $options: 'i' } }
      ];
    }

    const [data, total] = await Promise.all([
      FraudAlertModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      FraudAlertModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    };
  }

  async findByAlertId(alertId: string): Promise<FraudAlertDocument | null> {
    return FraudAlertModel.findOne({ alertId }).exec();
  }
}
