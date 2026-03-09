import { CaseDocument, CaseModel, CasePriority, CaseStatus } from '../models/Case';

interface CaseListFilters {
  status?: CaseStatus;
  priority?: CasePriority;
  investigatorId?: string;
  transactionId?: string;
  limit: number;
  page: number;
}

export class CaseRepository {
  async create(payload: Partial<CaseDocument>): Promise<CaseDocument> {
    return CaseModel.create(payload);
  }

  async updateByCaseId(caseId: string, updates: Partial<CaseDocument>): Promise<CaseDocument | null> {
    return CaseModel.findOneAndUpdate({ caseId }, updates, { new: true });
  }

  async findByCaseId(caseId: string): Promise<CaseDocument | null> {
    return CaseModel.findOne({ caseId });
  }

  async list(filters: CaseListFilters): Promise<{
    data: CaseDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.caseStatus = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.investigatorId) query.investigatorId = filters.investigatorId;
    if (filters.transactionId) query.transactionId = filters.transactionId;

    const skip = (filters.page - 1) * filters.limit;
    const [data, total] = await Promise.all([
      CaseModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(filters.limit),
      CaseModel.countDocuments(query)
    ]);

    return {
      data,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.max(1, Math.ceil(total / filters.limit))
    };
  }
}
