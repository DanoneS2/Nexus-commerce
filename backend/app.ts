import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import passport from 'passport';

import { env } from './config/env';
import { logger } from './config/logger';
import { rateLimiter, strictRateLimiter } from './middleware/security.middleware';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestId, sanitizeInput, csrfProtection, detectSuspiciousActivity } from './middleware/security.middleware';
import { setupPassport } from './config/passport';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import brandRoutes from './routes/brand.routes';
import orderRoutes from './routes/order.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reviewRoutes from './routes/review.routes';
import chatRoutes from './routes/chat.routes';
import ticketRoutes from './routes/ticket.routes';
import couponRoutes from './routes/coupon.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import uploadRoutes from './routes/upload.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// Trust proxy (behind Nginx/Cloudflare)
app.set('trust proxy', 1);

// Request ID (para tracing)
app.use(requestId);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Configurado no Nginx para permitir Three.js e WebGL
  crossOriginEmbedderPolicy: false, // Necessário para Three.js
  hsts: false,
}));

// HPP - HTTP Parameter Pollution protection
app.use(hpp());

// CORS configurado para permitir o frontend Next.js
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,
}));

// Body parsing
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Sanitização de inputs (evita XSS)
app.use(sanitizeInput);

// Compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.url === '/health' || req.url === '/metrics',
}));

// Detecção de atividade suspeita (DDoS, scraping)
app.use(detectSuspiciousActivity);

// Rate limiting
app.use('/api/', rateLimiter);
app.use('/api/auth/login', strictRateLimiter);
app.use('/api/auth/register', strictRateLimiter);
app.use('/api/auth/forgot-password', strictRateLimiter);
app.use('/api/auth/reset-password', strictRateLimiter);

// CSRF Protection (exceto para API com Bearer token)
app.use(csrfProtection);

// Passport (OAuth)
setupPassport();
app.use(passport.initialize());

// Health check endpoint
app.get('/health', async (req, res) => {
  const { prisma } = await import('./config/database');
  const { redis } = await import('./config/redis');
  
  const checks = {
    database: false,
    redis: false,
    timestamp: new Date().toISOString(),
  };
  
  let status = 200;
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    checks.database = false;
    status = 503;
    logger.error('Health check failed: database', error);
  }
  
  try {
    await redis.ping();
    checks.redis = true;
  } catch (error) {
    checks.redis = false;
    status = 503;
    logger.error('Health check failed: redis', error);
  }
  
  res.status(status).json({
    status: status === 200 ? 'healthy' : 'unhealthy',
    ...checks,
  });
});

// API Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/wishlist', wishlistRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/webhooks', webhookRoutes);

app.use('/api', apiRouter);

// 404 handler
app.use(notFound);

// Error handler (deve ser o último middleware)
app.use(errorHandler);

export { app };