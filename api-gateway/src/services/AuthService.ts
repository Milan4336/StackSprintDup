import { UserRepository } from '../repositories/UserRepository';
import type { UserDocument } from '../models/User';
import { AppError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';
import { signJwt } from '../utils/jwt';
import { AuditService } from './AuditService';
import { buildOtpAuthUrl, generateBase32Secret, verifyTotpCode } from '../utils/totp';
import { env } from '../config/env';
import type { SignOptions } from 'jsonwebtoken';

interface OtpRepositoryContract {
  create: (userId: string, code: string) => Promise<unknown>;
  verify: (userId: string, code: string) => Promise<boolean>;
}

type LoginSuccessResponse = {
  token: string;
  userId: string;
  mfaRequired?: false;
};

type LoginMfaChallengeResponse = {
  mfaRequired: true;
  mfaToken: string;
  userId: string;
  message: string;
};

type LoginResponse = LoginSuccessResponse | LoginMfaChallengeResponse;

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditService: AuditService,
    private readonly otpRepository: OtpRepositoryContract
  ) { }

  private resolveUserId(user: UserDocument): string {
    return user.userId || user.email || String(user._id);
  }

  private issueToken(user: UserDocument, options?: { mfaPending?: boolean; expiresIn?: SignOptions['expiresIn'] }): string {
    const pending = Boolean(options?.mfaPending);
    return signJwt(
      {
        sub: this.resolveUserId(user),
        email: user.email,
        role: user.role,
        status: user.status,
        mfaPending: pending,
        mfaVerified: pending ? false : true
      },
      options?.expiresIn
    );
  }

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
        token: this.issueToken(user)
      };

    } catch (error: any) {
      if (error?.code === 11000 || error?.message?.includes('duplicate key')) {
        throw new AppError('User already exists', 409);
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to register user', 500);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const user = await this.userRepository.findByEmail(email, true);

      if (!user || !comparePassword(password, user.password)) {
        throw new AppError('Invalid credentials', 401);
      }

      if (user.status === 'FROZEN') {
        throw new AppError('Account is frozen due to suspicious activity. Contact support.', 403);
      }

      const resolvedUserId = user.userId || user.email || String(user._id);
      await this.userRepository.markLoginSuccess(email, resolvedUserId);

      if (user.mfaEnabled) {
        await this.auditService.log({
          eventType: 'AUTH_MFA_CHALLENGE',
          action: 'challenge',
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
          mfaRequired: true,
          mfaToken: this.issueToken(user, { mfaPending: true, expiresIn: '10m' }),
          userId: resolvedUserId,
          message: 'MFA verification required'
        };
      }

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
        token: this.issueToken(user),
        userId: resolvedUserId
      };

    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500);
    }
  }

  async setupMfa(userIdOrEmail: string): Promise<{
    enabled: boolean;
    issuer: string;
    accountName: string;
    secret: string;
    otpauthUrl: string;
  }> {
    const user = await this.userRepository.findByEmailOrUserId(userIdOrEmail, true);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const secret = generateBase32Secret(20);
    await this.userRepository.setMfaSecret(this.resolveUserId(user), secret);

    const otpauthUrl = buildOtpAuthUrl(env.MFA_TOTP_ISSUER, user.email, secret);

    await this.auditService.log({
      eventType: 'AUTH_MFA_SETUP',
      action: 'setup',
      entityType: 'user',
      entityId: this.resolveUserId(user),
      actor: {
        actorId: this.resolveUserId(user),
        actorEmail: user.email
      },
      metadata: {
        issuer: env.MFA_TOTP_ISSUER
      }
    });

    return {
      enabled: false,
      issuer: env.MFA_TOTP_ISSUER,
      accountName: user.email,
      secret,
      otpauthUrl
    };
  }

  async enableMfa(userIdOrEmail: string, code: string): Promise<{ enabled: boolean; verifiedAt: string; token: string }> {
    const user = await this.userRepository.findByEmailOrUserId(userIdOrEmail, true);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.mfaSecret) {
      throw new AppError('MFA setup is required before enabling MFA', 400);
    }

    const valid = verifyTotpCode(user.mfaSecret, code, { window: 1 });
    if (!valid) {
      throw new AppError('Invalid MFA code', 401);
    }

    const verifiedAt = new Date();
    await this.userRepository.setMfaEnabled(this.resolveUserId(user), true, verifiedAt);
    user.mfaEnabled = true;
    user.mfaVerifiedAt = verifiedAt;

    await this.auditService.log({
      eventType: 'AUTH_MFA_ENABLED',
      action: 'enable',
      entityType: 'user',
      entityId: this.resolveUserId(user),
      actor: {
        actorId: this.resolveUserId(user),
        actorEmail: user.email
      },
      metadata: {
        verifiedAt: verifiedAt.toISOString()
      }
    });

    return {
      enabled: true,
      verifiedAt: verifiedAt.toISOString(),
      token: this.issueToken(user)
    };
  }

  async verifyMfa(
    userIdOrEmail: string,
    code: string,
    reason = 'SESSION_STEP_UP'
  ): Promise<{ verified: boolean; verifiedAt: string; token: string }> {
    const user = await this.userRepository.findByEmailOrUserId(userIdOrEmail, true);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new AppError('MFA is not enabled for this account', 400);
    }

    const valid = verifyTotpCode(user.mfaSecret, code, { window: 1 });
    if (!valid) {
      throw new AppError('Invalid MFA code', 401);
    }

    const verifiedAt = new Date();
    await this.userRepository.setMfaEnabled(this.resolveUserId(user), true, verifiedAt);
    user.mfaVerifiedAt = verifiedAt;

    await this.auditService.log({
      eventType: 'AUTH_MFA_VERIFIED',
      action: 'verify',
      entityType: 'user',
      entityId: this.resolveUserId(user),
      actor: {
        actorId: this.resolveUserId(user),
        actorEmail: user.email
      },
      metadata: {
        reason,
        verifiedAt: verifiedAt.toISOString()
      }
    });

    return {
      verified: true,
      verifiedAt: verifiedAt.toISOString(),
      token: this.issueToken(user)
    };
  }

  async mfaStatus(userIdOrEmail: string): Promise<{
    enabled: boolean;
    hasSecret: boolean;
    verifiedAt: string | null;
    issuer: string;
  }> {
    const user = await this.userRepository.findByEmailOrUserId(userIdOrEmail, true);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      enabled: Boolean(user.mfaEnabled),
      hasSecret: Boolean(user.mfaSecret),
      verifiedAt: user.mfaVerifiedAt ? user.mfaVerifiedAt.toISOString() : null,
      issuer: env.MFA_TOTP_ISSUER
    };
  }

  async requestOtp(userId: string) {
    const user = await this.userRepository.findByEmailOrUserId(userId);
    if (!user) throw new AppError('User not found', 404);
    const resolvedUserId = user.userId || user.email || String(user._id);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.otpRepository.create(resolvedUserId, code);

    // OTP fallback is intentionally logged only in non-production simulation mode.
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(`[BANK-GRADE SECURITY] OTP for ${user.email}: ${code}`);
    }

    await this.auditService.log({
      eventType: 'AUTH_OTP_REQUESTED',
      action: 'request',
      entityType: 'otp',
      entityId: resolvedUserId,
      actor: { actorId: resolvedUserId, actorEmail: user.email },
      metadata: { method: 'SMS_FALLBACK' }
    });

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(userId: string, code: string) {
    const isValid = await this.otpRepository.verify(userId, code);
    if (!isValid) throw new AppError('Invalid or expired OTP', 401);

    const user = await this.userRepository.findByEmailOrUserId(userId);
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
    const user = await this.userRepository.findByEmailOrUserId(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      userId: user.userId || user.email || String(user._id),
      email: user.email,
      role: user.role,
      status: user.status,
      riskScore: user.riskScore,
      lastLogin: user.lastLogin,
      mfaEnabled: user.mfaEnabled,
      mfaVerifiedAt: user.mfaVerifiedAt
    };
  }
}
