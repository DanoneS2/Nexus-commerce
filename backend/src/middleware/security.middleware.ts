import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

// ─── Rate Limiter (Redis-backed) ──────────────────────────────────────────────
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

// ─── Strict Rate Limiter (for auth endpoints) ─────────────────────────────────
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  keyGenerator: (req) => `auth:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Try again in 15 minutes.',
    });
  },
});

// ─── JWT Authentication Middleware ────────────────────────────────────────────
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.slice(7);

  // Check token blacklist
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new AppError('Token revoked', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isBanned: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!user) throw new AppError('User not found', 401);
    if (user.isBanned) throw new AppError('Account suspended', 403);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw error;
  }
};

// ─── Optional Authentication ──────────────────────────────────────────────────
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) return next();

    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, username: true, role: true, isBanned: true },
    });

    if (user && !user.isBanned) req.user = user;
  } catch {
    // Silent fail - optional auth
  }
  next();
};

// ─── Role-Based Access Control ────────────────────────────────────────────────
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError('Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
};

export const requireAdmin = requireRole('ADMIN', 'SUPERADMIN');
export const requireModerator = requireRole('MODERATOR', 'ADMIN', 'SUPERADMIN');
export const requireSuperAdmin = requireRole('SUPERADMIN');

// ─── CSRF Protection ──────────────────────────────────────────────────────────
export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  // Only apply to state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  // Skip for API clients using Bearer token (SPA, mobile)
  if (req.headers.authorization?.startsWith('Bearer ')) return next();

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionToken = req.cookies?.csrf_token;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    throw new AppError('Invalid CSRF token', 403);
  }

  next();
};

// ─── Email Verified Middleware ────────────────────────────────────────────────
export const requireEmailVerified = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    throw new AppError('Please verify your email address first', 403);
  }

  next();
};

// ─── Input Sanitization ───────────────────────────────────────────────────────
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and event handlers
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) return obj.map(sanitize);
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, sanitize(v)])
      );
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
};

// ─── Request ID Middleware ────────────────────────────────────────────────────
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

// ─── Suspicious Activity Detection ───────────────────────────────────────────
export const detectSuspiciousActivity = async (
  req: Request, res: Response, next: NextFunction
) => {
  const ip = req.ip!;
  const key = `suspicious:${ip}`;

  // Check if IP is temporarily blocked
  const blocked = await redis.get(`blocked:${ip}`);
  if (blocked) {
    throw new AppError('Access temporarily restricted', 429);
  }

  // Track request patterns
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60); // 1 minute window

  if (count > 500) {
    // Block IP for 1 hour
    await redis.setex(`blocked:${ip}`, 3600, '1');
    throw new AppError('Access temporarily restricted due to suspicious activity', 429);
  }

  next();
};
