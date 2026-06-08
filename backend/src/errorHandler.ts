import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const requestId = (req as any).id || 'unknown';
  
  // Log do erro
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`[${requestId}] ${err.statusCode} - ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error(`[${requestId}] Erro não tratado:`, {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Erro customizado AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: env.NODE_ENV === 'development' ? err.details : undefined,
      requestId,
    });
  }

  // Erro do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Já existe um registro com esse dado único',
          code: 'DUPLICATE_ERROR',
          requestId,
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Registro não encontrado',
          code: 'NOT_FOUND',
          requestId,
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Erro no banco de dados: ${err.message}`,
          code: 'DATABASE_ERROR',
          requestId,
        });
    }
  }

  // Erro de validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      requestId,
    });
  }

  // Erro JWT
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      code: 'INVALID_TOKEN',
      requestId,
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED',
      requestId,
    });
  }

  // Erro padrão
  const statusCode = (err as any).statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'Erro interno do servidor'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    requestId,
  });
};