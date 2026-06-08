import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';
import { redis } from './redis';
import { env } from './env';
import { logger } from './logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketIO = (io: Server) => {
  // ─── Authentication Middleware ───────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      // Check blacklist
      const isBlacklisted = await redis.get(`blacklist:${token}`);
      if (isBlacklisted) return next(new Error('Token revoked'));

      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, role: true, isBanned: true },
      });

      if (!user || user.isBanned) return next(new Error('Access denied'));

      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Rate Limiting for Socket Events ─────────────────────────────────
  const socketRateLimit = async (socket: AuthenticatedSocket, event: string): Promise<boolean> => {
    const key = `socket_rate:${socket.userId}:${event}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 10); // 10 second window
    return count <= 20; // Max 20 events per 10 seconds
  };

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // Update user online status
    if (socket.userId) {
      redis.setex(`online:${socket.userId}`, 30, '1');
      socket.join(`user:${socket.userId}`);
    }

    // ─── Chat Room ──────────────────────────────────────────────────
    socket.on('chat:join', async ({ roomId }: { roomId: string }) => {
      if (!socket.userId) return;

      // Verify user has access to this room
      const hasAccess = await verifyRoomAccess(socket.userId, roomId, socket.userRole);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      socket.join(`chat:${roomId}`);
      socket.emit('chat:joined', { roomId });

      // Load history
      const messages = await prisma.chatMessage.findMany({
        where: { roomId },
        include: {
          user: {
            select: { id: true, username: true, firstName: true, avatarUrl: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      socket.emit('chat:history', { messages: messages.reverse() });
    });

    socket.on('chat:leave', ({ roomId }: { roomId: string }) => {
      socket.leave(`chat:${roomId}`);
    });

    socket.on('chat:message', async ({ roomId, body, messageType = 'text' }: {
      roomId: string;
      body: string;
      messageType?: string;
    }) => {
      if (!socket.userId) return;
      if (!await socketRateLimit(socket, 'chat:message')) {
        socket.emit('error', { message: 'Slow down! Too many messages.' });
        return;
      }

      // Sanitize
      const sanitized = body.slice(0, 2000).replace(/<[^>]*>/g, '');
      if (!sanitized.trim()) return;

      const message = await prisma.chatMessage.create({
        data: {
          roomId,
          userId: socket.userId,
          body: sanitized,
          messageType,
        },
        include: {
          user: {
            select: { id: true, username: true, firstName: true, avatarUrl: true, role: true },
          },
        },
      });

      io.to(`chat:${roomId}`).emit('chat:message', message);
    });

    socket.on('chat:typing', ({ roomId }: { roomId: string }) => {
      if (!socket.userId) return;
      socket.to(`chat:${roomId}`).emit('chat:typing', { userId: socket.userId });
    });

    socket.on('chat:stop_typing', ({ roomId }: { roomId: string }) => {
      if (!socket.userId) return;
      socket.to(`chat:${roomId}`).emit('chat:stop_typing', { userId: socket.userId });
    });

    // ─── Support Tickets ────────────────────────────────────────────
    socket.on('ticket:join', async ({ ticketId }: { ticketId: string }) => {
      if (!socket.userId) return;

      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          OR: [
            { userId: socket.userId },
            // Admins/moderators can join any ticket
            ...(socket.userRole === 'ADMIN' || socket.userRole === 'MODERATOR' ? [{}] : []),
          ],
        },
      });

      if (!ticket) {
        socket.emit('error', { message: 'Ticket not found or access denied' });
        return;
      }

      socket.join(`ticket:${ticketId}`);
    });

    socket.on('ticket:message', async ({ ticketId, body, attachments }: {
      ticketId: string;
      body: string;
      attachments?: string[];
    }) => {
      if (!socket.userId) return;
      if (!await socketRateLimit(socket, 'ticket:message')) return;

      const sanitized = body.slice(0, 5000).replace(/<script[^>]*>.*?<\/script>/gi, '');

      const isStaff = ['ADMIN', 'MODERATOR', 'SUPERADMIN'].includes(socket.userRole || '');

      const message = await prisma.ticketMessage.create({
        data: {
          ticketId,
          userId: socket.userId,
          body: sanitized,
          isStaff,
          attachments: attachments || [],
        },
        include: {
          user: {
            select: { id: true, username: true, firstName: true, avatarUrl: true, role: true },
          },
        },
      });

      io.to(`ticket:${ticketId}`).emit('ticket:message', message);

      // Update ticket status
      if (!isStaff) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS', updatedAt: new Date() },
        });
      }
    });

    // ─── Notifications ──────────────────────────────────────────────
    socket.on('notification:mark_read', async ({ notificationId }: { notificationId: string }) => {
      if (!socket.userId) return;

      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: socket.userId,
        },
        data: { isRead: true, readAt: new Date() },
      });
    });

    // ─── Heartbeat ──────────────────────────────────────────────────
    socket.on('heartbeat', () => {
      if (socket.userId) {
        redis.setex(`online:${socket.userId}`, 30, '1');
      }
      socket.emit('heartbeat:ack');
    });

    // ─── Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
      if (socket.userId) {
        redis.del(`online:${socket.userId}`);
      }
    });
  });

  // ─── Admin namespace ─────────────────────────────────────────────────
  const adminNs = io.of('/admin');

  adminNs.use(async (socket: AuthenticatedSocket, next) => {
    // Same auth but requires admin role
    if (!['ADMIN', 'SUPERADMIN'].includes(socket.userRole || '')) {
      return next(new Error('Admin access required'));
    }
    next();
  });

  adminNs.on('connection', (socket) => {
    logger.info(`Admin socket connected: ${socket.id}`);
    socket.join('admins');
  });

  // Export admin namespace for broadcasting from controllers
  (io as any).adminNs = adminNs;
};

async function verifyRoomAccess(userId: string, roomId: string, role?: string): Promise<boolean> {
  // Admins can access any room
  if (role === 'ADMIN' || role === 'SUPERADMIN' || role === 'MODERATOR') return true;

  // Users can only access their own rooms (e.g., support chat)
  return roomId === `user_${userId}` || roomId.startsWith('ticket_');
}
