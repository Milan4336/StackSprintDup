import { UserDocument, UserModel } from '../models/User';

export class UserRepository {
  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email });
  }

  async upsert(email: string, password: string, role: 'admin' | 'analyst'): Promise<UserDocument> {
    return UserModel.findOneAndUpdate(
      { email },
      { $set: { email, password, role } },
      { upsert: true, new: true }
    );
  }
}
