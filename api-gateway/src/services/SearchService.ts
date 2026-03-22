import { CaseModel } from '../models/Case';
import { FraudAlertModel } from '../models/FraudAlert';
import { TransactionModel } from '../models/Transaction';
import { UserModel } from '../models/User';

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class SearchService {
  async search(raw: string) {
    const query = raw.trim();
    if (!query) {
      return {
        transactions: [],
        users: [],
        alerts: [],
        cases: []
      };
    }

    const safe = escapeRegex(query);
    const pattern = { $regex: safe, $options: 'i' };

    const [transactions, users, alerts, cases] = await Promise.all([
      TransactionModel.find({
        $or: [{ transactionId: pattern }, { userId: pattern }, { deviceId: pattern }, { location: pattern }]
      })
        .sort({ timestamp: -1 })
        .limit(20),
      UserModel.find({ $or: [{ email: pattern }, { role: pattern }] })
        .select('email role createdAt')
        .limit(20),
      FraudAlertModel.find({
        $or: [{ alertId: pattern }, { transactionId: pattern }, { userId: pattern }, { reason: pattern }]
      })
        .sort({ createdAt: -1 })
        .limit(20),
      CaseModel.find({
        $or: [{ caseId: pattern }, { transactionId: pattern }, { assignedTo: pattern }]
      })
        .sort({ updatedAt: -1 })
        .limit(20)
    ]);

    return {
      transactions,
      users,
      alerts,
      cases
    };
  }
}
