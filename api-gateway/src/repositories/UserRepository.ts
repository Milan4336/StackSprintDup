import { UserDocument, UserModel } from '../models/User';
import { AppError } from '../utils/errors';

export class UserRepository {

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  async upsert(
    email: string,
    password: string,
    role: 'admin' | 'analyst' | 'user',
    userId?: string
  ): Promise<UserDocument> {

    try {

      // First check if user already exists
      const existing = await UserModel.findOne({ email }).exec();

      if (existing) {
        throw new AppError('User already exists', 409); // ← was: return existing
      }

      // Create new user safely
      const user = new UserModel({
        userId: userId || email,
        email,
        password,
        role,
        status: 'ACTIVE'
      });

      await user.save();

      return user;

    } catch (error: any) {

      // Re-throw AppErrors as-is (including the 409 above)
      if (error instanceof AppError) {
        throw error;
      }

      // CosmosDB duplicate key handling (race condition fallback)
      if (
        error?.code === 11000 ||
        error?.message?.includes('duplicate key') ||
        error?.message?.includes('E11000')
      ) {
        throw new AppError('User already exists', 409);
      }

      throw new AppError('Failed to create user', 500);
    }
  }
}