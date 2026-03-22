import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(email: string, password: string, role: 'admin' | 'analyst') {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError('User already exists', 409);
    }
    const user = await this.userRepository.upsert(email, hashPassword(password), role);
    return { token: signJwt({ sub: String(user._id), email: user.email, role: user.role }) };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !comparePassword(password, user.password)) {
      throw new AppError('Invalid credentials', 401);
    }
    return { token: signJwt({ sub: String(user._id), email: user.email, role: user.role }) };
  }
}
