import Bull from 'bull';
import { redis } from './redis';
import { env } from './env';
import { logger } from './logger';
import { prisma } from './database';
import { emailService } from '../services/email.service';

const queueOptions = {
  redis: env.REDIS_URL,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// ─── Queue Definitions ────────────────────────────────────────────────────────
export const emailQueue = new Bull('email', queueOptions);
export const abandonedCartQueue = new Bull('abandoned-cart', queueOptions);
export const notificationQueue = new Bull('notification', queueOptions);
export const reportQueue = new Bull('report', queueOptions);
export const stockAlertQueue = new Bull('stock-alert', queueOptions);

// ─── Email Queue Processor ────────────────────────────────────────────────────
emailQueue.process(async (job) => {
  const { type, to, data } = job.data;

  switch (type) {
    case 'order_confirmation':
      await emailService.sendOrderConfirmation(to, data);
      break;
    case 'order_shipped':
      await emailService.sendOrderShipped(to, data.orderNumber, data.trackingCode);
      break;
    case 'email_verification':
      await emailService.sendEmailVerification(to, data.token, data.name);
      break;
    case 'password_reset':
      await emailService.sendPasswordReset(to, data.token, data.name);
      break;
    case 'ticket_reply':
      await emailService.sendTicketReply(to, data.ticketNumber, data.message);
      break;
    case 'welcome':
      await emailService.sendWelcome(to, data.firstName);
      break;
    default:
      logger.warn(`Unknown email type: ${type}`);
  }
});

// ─── Abandoned Cart Processor ─────────────────────────────────────────────────
abandonedCartQueue.process(async (job) => {
  const { userId } = job.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          name: true,
          basePrice: true,
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  if (!user || cartItems.length === 0) return;

  await emailService.sendAbandonedCart(
    user.email,
    user.firstName || 'Cliente',
    cartItems.map((item) => ({
      name: typeof item.product.name === 'string'
        ? item.product.name
        : Object.values(item.product.name)[0] as string,
      imageUrl: item.product.images[0]?.url || '',
      price: Number(item.product.basePrice),
    }))
  );

  logger.info(`Abandoned cart email sent to user ${userId}`);
});

// ─── Notification Queue ───────────────────────────────────────────────────────
notificationQueue.process(async (job) => {
  const { userId, type, title, body, data } = job.data;

  await prisma.notification.create({
    data: { userId, type, title, body, data },
  });

  // Could push to push notification service here (FCM, APNs, etc.)
  logger.info(`Notification created for user ${userId}: ${type}`);
});

// ─── Report Queue ─────────────────────────────────────────────────────────────
reportQueue.process(async (job) => {
  const { type, adminEmail, period } = job.data;
  logger.info(`Generating ${type} report for ${period}`);
  // Generate CSV/PDF report and email to admin
});

// ─── Stock Alert Queue ────────────────────────────────────────────────────────
stockAlertQueue.process(async (job) => {
  const { variantId } = job.data;

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { name: true } } },
  });

  if (!variant) return;

  // Notify admin of low stock
  await notificationQueue.add({
    userId: 'admin', // Replace with actual admin ID
    type: 'SYSTEM',
    title: 'Estoque baixo',
    body: `Variante "${variant.name}" tem apenas ${variant.stock} unidades restantes.`,
    data: { variantId, productName: variant.product.name },
  });
});

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
export const setupBullQueues = () => {
  // Process abandoned carts — every hour
  abandonedCartQueue.add(
    { type: 'scan' },
    { repeat: { cron: '0 * * * *' } }
  );

  // Daily reports — every day at 8am UTC
  reportQueue.add(
    { type: 'daily_summary', period: 'yesterday' },
    { repeat: { cron: '0 8 * * *' } }
  );

  // ─── Queue event handlers ─────────────────────────────────────────────
  [emailQueue, abandonedCartQueue, notificationQueue, reportQueue, stockAlertQueue].forEach((q) => {
    q.on('completed', (job) => {
      logger.debug(`Queue [${q.name}] job ${job.id} completed`);
    });

    q.on('failed', (job, err) => {
      logger.error(`Queue [${q.name}] job ${job?.id} failed:`, err);
    });

    q.on('stalled', (job) => {
      logger.warn(`Queue [${q.name}] job ${job.id} stalled`);
    });
  });

  // Scan for abandoned carts
  abandonedCartQueue.process('scan', async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Users who haven't checked out in 1-3 days
    const usersWithCarts = await prisma.cartItem.findMany({
      where: {
        updatedAt: { lte: oneHourAgo, gte: threeDaysAgo },
      },
      distinct: ['userId'],
      select: { userId: true },
    });

    for (const { userId } of usersWithCarts) {
      const alreadySent = await redis.get(`cart_reminder:${userId}`);
      if (alreadySent) continue;

      await abandonedCartQueue.add({ userId });
      await redis.setex(`cart_reminder:${userId}`, 24 * 60 * 60, '1'); // 24h cooldown
    }

    logger.info(`Abandoned cart scan: ${usersWithCarts.length} users queued`);
  });

  logger.info('✅ Bull queues initialized');
};

// ─── Queue helpers for controllers ────────────────────────────────────────────
export const queueEmail = (type: string, to: string, data: object) =>
  emailQueue.add({ type, to, data });

export const queueNotification = (userId: string, type: string, title: string, body: string, data?: object) =>
  notificationQueue.add({ userId, type, title, body, data });

export const queueStockAlert = (variantId: string) =>
  stockAlertQueue.add({ variantId });
