import { UserRiskProfileDocument, UserRiskProfileModel } from '../models/UserRiskProfile';

export class UserRiskProfileRepository {
  async upsert(userId: string, payload: Partial<UserRiskProfileDocument>): Promise<UserRiskProfileDocument> {
    const next = await UserRiskProfileModel.findOneAndUpdate(
      { userId },
      { ...payload, userId },
      { new: true, upsert: true }
    );

    if (!next) {
      throw new Error('Failed to upsert user risk profile');
    }
    return next;
  }

  async findByUserId(userId: string): Promise<UserRiskProfileDocument | null> {
    return UserRiskProfileModel.findOne({ userId });
  }
}
