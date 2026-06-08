import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      myFormat
    ),
  }),
];

if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    timestamp(),
    env.NODE_ENV === 'production' ? json() : myFormat
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Acesso rápido para tipos específicos
export const logError = (message: string, meta?: object) => logger.error(message, meta);
export const logWarn = (message: string, meta?: object) => logger.warn(message, meta);
export const logInfo = (message: string, meta?: object) => logger.info(message, meta);
export const logDebug = (message: string, meta?: object) => logger.debug(message, meta);
export const logHttp = (message: string, meta?: object) => logger.http(message, meta);