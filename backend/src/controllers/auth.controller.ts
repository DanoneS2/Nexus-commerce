import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { emailService } from '../services/email.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../utils/AppError';
import { generateTokenPair, verifyRefreshToken } from '../utils/tokens';
import { getDeviceInfo } from '../utils/device';

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  const { email, username, password, firstName, lastName } = req.body;

  // Check duplicates
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true },
  });

  if (exists) {
    if (exists.email === email) throw new AppError('Email already in use', 409);
    throw new AppError('Username already taken', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      firstName,
      lastName,
      authProviders: {
        create: { provider: 'LOCAL', providerId: email },
      },
    },
    select: {
      id: true, email: true, username: true,
      firstName: true, lastName: true, role: true,
    },
  });

  // Send verification email
  const verificationToken = uuidv4();
  await prisma.emailVerificationToken.create({
    data: {
      email,
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  await emailService.sendEmailVerification(email, verificationToken, firstName);

  // Issue tokens
  const { accessToken, refreshToken } = await generateTokenPair(user.id);
  await createSession(req, user.id, refreshToken);

  await auditService.log({
    userId: user.id,
    action: 'USER_REGISTER',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email.',
    data: { user, accessToken, refreshToken },
  });
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  const { email, password, totpCode } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, email: true, username: true, role: true,
      passwordHash: true, isBanned: true, bannedReason: true,
      twoFactorEnabled: true, twoFactorSecret: true,
      firstName: true, lastName: true, avatarUrl: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.isBanned) {
    throw new AppError(`Account suspended: ${user.bannedReason || 'Contact support'}`, 403);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    // Track failed attempts
    await incrementFailedAttempts(email, req.ip!);
    throw new AppError('Invalid credentials', 401);
  }

  // 2FA check
  if (user.twoFactorEnabled) {
    if (!totpCode) {
      return res.json({
        success: true,
        requiresTwoFactor: true,
        message: '2FA code required',
      });
    }

    const valid = authenticator.verify({
      token: totpCode,
      secret: user.twoFactorSecret!,
    });

    if (!valid) {
      throw new AppError('Invalid 2FA code', 401);
    }
  }

  // Clear failed attempts
  await redis.del(`failed_logins:${email}`);

  const { accessToken, refreshToken } = await generateTokenPair(user.id);
  await createSession(req, user.id, refreshToken);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: req.ip,
    },
  });

  await auditService.log({
    userId: user.id,
    action: 'USER_LOGIN',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const { passwordHash, twoFactorSecret, ...safeUser } = user;

  res.json({
    success: true,
    data: { user: safeUser, accessToken, refreshToken },
  });
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) throw new AppError('Refresh token required', 400);

  const session = await prisma.session.findUnique({
    where: { refreshToken: token },
    include: { user: { select: { id: true, role: true, isBanned: true } } },
  });

  if (!session || !session.isActive || session.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  if (session.user.isBanned) {
    throw new AppError('Account suspended', 403);
  }

  // Verify JWT
  try {
    verifyRefreshToken(token);
  } catch {
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    throw new AppError('Invalid refresh token', 401);
  }

  // Rotate refresh token
  const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(session.userId);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshToken: newRefreshToken,
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
    },
  });

  res.json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken },
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (token) {
    await prisma.session.updateMany({
      where: { refreshToken: token },
      data: { isActive: false },
    });
  }

  // Blacklist access token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice(7);
    const ttl = env.JWT_ACCESS_TTL_SECONDS;
    await redis.setex(`blacklist:${accessToken}`, ttl, '1');
  }

  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Logout All Sessions ──────────────────────────────────────────────────────
export const logoutAll = async (req: Request, res: Response) => {
  await prisma.session.updateMany({
    where: { userId: req.user!.id, isActive: true },
    data: { isActive: false },
  });

  await auditService.log({
    userId: req.user!.id,
    action: 'USER_LOGOUT_ALL',
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'All sessions terminated' });
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.params;

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date() || record.usedAt) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ success: true, message: 'Email verified successfully' });
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  // Always return 200 to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true } });

  if (user) {
    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { expiresAt: new Date() }, // expire immediately
    });

    const token = uuidv4();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    await emailService.sendPasswordReset(email, token, user.firstName);
  }

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent.',
  });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { /* userId */ },
  });

  if (!record || record.expiresAt < new Date() || record.usedAt) {
    throw new AppError('Invalid or expired reset link', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
    // Invalidate all sessions
    prisma.session.updateMany({
      where: { userId: record.userId },
      data: { isActive: false },
    }),
  ]);

  await auditService.log({
    userId: record.userId,
    action: 'PASSWORD_RESET',
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'Password reset successfully' });
};

// ─── Setup 2FA ────────────────────────────────────────────────────────────────
export const setup2FA = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const secret = authenticator.generateSecret();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  const otpauthUrl = authenticator.keyuri(user!.email, 'Nexus Commerce', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Store temp secret in Redis until confirmed
  await redis.setex(`2fa_setup:${userId}`, 600, secret); // 10min

  res.json({
    success: true,
    data: { qrCode: qrCodeDataUrl, secret, otpauthUrl },
  });
};

// ─── Confirm 2FA ──────────────────────────────────────────────────────────────
export const confirm2FA = async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = req.user!.id;

  const tempSecret = await redis.get(`2fa_setup:${userId}`);
  if (!tempSecret) throw new AppError('2FA setup expired, start over', 400);

  const valid = authenticator.verify({ token: code, secret: tempSecret });
  if (!valid) throw new AppError('Invalid code', 400);

  // Generate backup codes
  const backupCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  const hashedBackups = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)));

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: tempSecret,
      twoFactorBackupCodes: hashedBackups,
    },
  });

  await redis.del(`2fa_setup:${userId}`);

  await auditService.log({ userId, action: '2FA_ENABLED', ipAddress: req.ip });

  res.json({
    success: true,
    message: '2FA enabled successfully',
    data: { backupCodes }, // Show once, never again
  });
};

// ─── OAuth Callback ───────────────────────────────────────────────────────────
export const oauthCallback = async (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user) throw new AppError('OAuth authentication failed', 401);

  const { accessToken, refreshToken } = await generateTokenPair(user.id);
  await createSession(req, user.id, refreshToken);

  // Redirect to frontend with tokens
  const redirectUrl = `${env.FRONTEND_URL}/auth/callback?` +
    `accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(redirectUrl);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function createSession(req: Request, userId: string, refreshToken: string) {
  const deviceInfo = getDeviceInfo(req.headers['user-agent']);
  return prisma.session.create({
    data: {
      userId,
      refreshToken,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceInfo: JSON.stringify(deviceInfo),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
    },
  });
}

async function incrementFailedAttempts(email: string, ip: string) {
  const key = `failed_logins:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes

  if (attempts >= 5) {
    logger.warn(`Brute force detected for ${email} from ${ip}`);
    // Could trigger CAPTCHA requirement or temporary lockout
  }
}
