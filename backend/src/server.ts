import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import { Server as SocketServer } from 'socket.io';
import passport from 'passport';

import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { setupPassport } from './config/passport';
import { setupSocketIO } from './config/socket';
import { setupBullQueues } from './config/queues';

// ─── Route Imports ────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reviewRoutes from './routes/review.routes';
import ticketRoutes from './routes/ticket.routes';
import couponRoutes from './routes/coupon.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadRoutes from './routes/upload.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── Trust Proxy (behind Nginx) ───────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Configured in Nginx
  hsts: false, // Configured in Nginx
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  maxAge: 86400,
}));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Webhook route needs raw body for Stripe signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health',
}));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api/', rateLimiter);

// ─── Passport ─────────────────────────────────────────────────────────────────
setupPassport();
app.use(passport.initialize());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { database: 'ok', redis: 'ok' },
    });
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Service unavailable' });
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/upload', uploadRoutes);

app.use('/api', apiRouter);
app.use('/api/webhooks', webhookRoutes);

// ─── Not Found & Error Handlers ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Socket.IO Setup ──────────────────────────────────────────────────────────
setupSocketIO(io);

// ─── Bull Queues Setup ────────────────────────────────────────────────────────
setupBullQueues();

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = env.PORT || 4000;

server.listen(PORT, () => {
  logger.info(`🚀 Nexus Commerce API running on port ${PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  server.close(async () => {
    await prisma.$disconnect();
    redis.disconnect();
    logger.info('Server shut down cleanly.');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Force shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

export { io };
