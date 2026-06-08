import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';

interface TokenPayload {
  sub: string;
  role: string;
  jti?: string;
}

export const generateAccessToken = (userId: string, role: string): string => {
  const jti = `${userId}-${Date.now()}`;
  return jwt.sign(
    { sub: userId, role, jti },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
};

export const generateRefreshToken = (userId: string, role: string): string => {
  return jwt.sign(
    { sub: userId, role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL }
  );
};

export const generateTokenPair = async (userId: string, role: string) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role);
  
  // Store refresh token in Redis para invalidação rápida
  await redis.setex(`refresh:${refreshToken}`, 30 * 24 * 60 * 60, userId);
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

export const invalidateRefreshToken = async (refreshToken: string): Promise<void> => {
  await redis.del(`refresh:${refreshToken}`);
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
};

export const blacklistToken = async (token: string, ttl: number): Promise<void> => {
  await redis.setex(`blacklist:${token}`, ttl, '1');
};