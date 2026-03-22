import { ModelMetricDocument, ModelMetricModel } from '../models/ModelMetric';

export class ModelMetricRepository {
  async create(payload: Partial<ModelMetricDocument>): Promise<ModelMetricDocument> {
    return ModelMetricModel.create(payload);
  }

  async findRecent(limit = 100): Promise<ModelMetricDocument[]> {
    return ModelMetricModel.find({}).sort({ snapshotAt: -1 }).limit(limit);
  }

  async findLatest(): Promise<ModelMetricDocument | null> {
    return ModelMetricModel.findOne({}).sort({ snapshotAt: -1 });
  }
}
