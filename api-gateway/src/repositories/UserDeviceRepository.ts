import { UserDeviceDocument, UserDeviceModel } from '../models/UserDevice';

export class UserDeviceRepository {
  async findByUserAndDevice(userId: string, deviceId: string): Promise<UserDeviceDocument | null> {
    return UserDeviceModel.findOne({ userId, deviceId });
  }

  async upsert(payload: Partial<UserDeviceDocument>): Promise<UserDeviceDocument> {
    const now = new Date();
    return UserDeviceModel.findOneAndUpdate(
      { userId: payload.userId, deviceId: payload.deviceId },
      {
        $set: {
          location: payload.location,
          lastSeen: payload.lastSeen ?? now,
          isSuspicious: payload.isSuspicious,
          riskLevel: payload.riskLevel
        },
        $setOnInsert: {
          firstSeen: payload.firstSeen ?? now
        },
        $inc: { txCount: 1 }
      },
      { upsert: true, new: true }
    );
  }

  async findRecent(limit = 200): Promise<UserDeviceDocument[]> {
    return UserDeviceModel.find({}).sort({ updatedAt: -1 }).limit(limit);
  }
}
