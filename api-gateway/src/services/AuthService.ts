import { UserRepository } from '../repositories/UserRepository';
import { AppError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { AuditService } from './AuditService';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
    private readonly otpRepository: any
  ) { }

  async register(email: string, password: string, role: 'admin' | 'analyst' | 'user') {
    try {
      // Check if user already exists
      const existing = await this.userRepository.findByEmail(email);

      if (existing) {
        throw new AppError('User already exists', 409);
      }

      // Create user
      const user = await this.userRepository.upsert(
        email,
        hashPassword(password),
        role
      );

      // Audit log
      await this.auditService.log({
        eventType: 'AUTH_REGISTER',
        action: 'register',
        entityType: 'user',
        entityId: String(user._id),
        actor: {
          actorId: String(user._id),
          actorEmail: user.email
        },
        metadata: {
          role: user.role
        }
      });

      // Return JWT token
      return {
        token: signJwt({
          sub: user.userId || String(user._id),
          email: user.email,
          role: user.role,
          status: user.status
        })
      };

    } catch (error: any) {
      if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
        throw new AppError('User already exists', 409);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500);
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.userRepository.findByEmail(email);

      console.error(`[DEBUG LOGIN] email: ${email}`);
      console.error(`[DEBUG LOGIN] user exists?: ${!!user}`);
      if (user) {
        console.error(`[DEBUG LOGIN] password hash match?: ${comparePassword(password, user.password)}`);
      }

      if (!user || !comparePassword(password, user.password)) {
        throw new AppError('Invalid credentials', 401);
      }

      if (user.status === 'FROZEN') {
        throw new AppError('Account is frozen due to suspicious activity. Contact support.', 403);
      }

      // Update last login
      user.lastLogin = new Date();
      if (!user.userId) {
        user.userId = user.email;
      }
      await user.save();

      await this.auditService.log({
        eventType: 'AUTH_LOGIN',
        action: 'login',
        entityType: 'user',
        entityId: String(user._id),
        actor: {
          actorId: String(user._id),
          actorEmail: user.email
        },
        metadata: {
          role: user.role
        }
      });

      return {
        token: signJwt({
          sub: user.userId || String(user._id),
          email: user.email,
          role: user.role,
          status: user.status
        }),
        userId: user.userId || String(user._id)
      };

    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error("Inner Login Error:", error);
      throw new AppError('Login failed', 500);
    }
  }

  async requestOtp(userId: string) {
    const user = await this.userRepository.findByEmail(userId);
    if (!user) throw new AppError('User not found', 404);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.create(user.userId, code);

    console.log(`[BANK-GRADE SECURITY] OTP for ${user.email}: ${code}`);

    await this.auditService.log({
      eventType: 'AUTH_OTP_REQUESTED',
      action: 'request',
      entityType: 'otp',
      entityId: user.userId,
      actor: { actorId: user.userId, actorEmail: user.email },
      metadata: { method: 'SMS_FALLBACK' }
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(userId: string, code: string) {
    const isValid = await this.otpRepository.verify(userId, code);
    if (!isValid) throw new AppError('Invalid or expired OTP', 401);

    const user = await this.userRepository.findByEmail(userId);
    if (user && user.status === 'RESTRICTED') {
      user.status = 'ACTIVE';
      await user.save();
    }

    await this.auditService.log({
      eventType: 'AUTH_OTP_VERIFIED',
      action: 'verify',
      entityType: 'otp',
      entityId: userId,
      metadata: { success: true }
    });

    return { message: 'OTP verified successfully' };
  }

  async me(userId: string) {
    const user = await this.userRepository.findByEmail(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      status: user.status,
      riskScore: user.riskScore,
      lastLogin: user.lastLogin
    };
  }
}