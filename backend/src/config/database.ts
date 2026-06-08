import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'],
  errorFormat: 'pretty',
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
const disconnectPrisma = async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
};

process.on('SIGTERM', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);

export default prisma;