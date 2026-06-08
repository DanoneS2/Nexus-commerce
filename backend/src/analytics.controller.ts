import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns';
import { AppError } from '../utils/AppError';

type Period = '7d' | '30d' | '90d';

const CACHE_TTL = 300; // 5 minutes

export const getDashboard = async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || '30d';
  const cacheKey = `analytics:dashboard:${period}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ success: true, data: JSON.parse(cached), cached: true });
  }

  const days = { '7d': 7, '30d': 30, '90d': 90 }[period];
  const startDate = startOfDay(subDays(new Date(), days));
  const prevStartDate = startOfDay(subDays(new Date(), days * 2));

  // ─── Revenue ─────────────────────────────────────────────────────────
  const [currentRevenue, prevRevenue] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: prevStartDate, lt: startDate },
      },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  const revenueTotal = Number(currentRevenue._sum.total ?? 0);
  const revenuePrev = Number(prevRevenue._sum.total ?? 0);
  const revenueChange = revenuePrev > 0
    ? Math.round(((revenueTotal - revenuePrev) / revenuePrev) * 100)
    : 100;

  // ─── Orders ───────────────────────────────────────────────────────────
  const ordersChange = prevRevenue._count > 0
    ? Math.round(((currentRevenue._count - prevRevenue._count) / prevRevenue._count) * 100)
    : 100;

  // ─── Customers ────────────────────────────────────────────────────────
  const [currentCustomers, prevCustomers] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startDate } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: prevStartDate, lt: startDate } } }),
  ]);

  const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  const customersChange = prevCustomers > 0
    ? Math.round(((currentCustomers - prevCustomers) / prevCustomers) * 100)
    : 100;

  // ─── Products ─────────────────────────────────────────────────────────
  const [totalProducts, activeProducts] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
  ]);

  // ─── Sales by Day ─────────────────────────────────────────────────────
  const salesRaw = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
      createdAt: { gte: startDate },
    },
    _sum: { total: true },
    _count: true,
  });

  // Build a complete day-by-day array (fill gaps with 0)
  const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
  const salesMap = new Map<string, { revenue: number; orders: number }>();

  salesRaw.forEach((s) => {
    const key = format(new Date(s.createdAt), 'yyyy-MM-dd');
    const existing = salesMap.get(key) || { revenue: 0, orders: 0 };
    salesMap.set(key, {
      revenue: existing.revenue + Number(s._sum.total ?? 0),
      orders: existing.orders + s._count,
    });
  });

  const salesByDay = allDays.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const data = salesMap.get(key) || { revenue: 0, orders: 0 };
    return { date: key, ...data };
  });

  // ─── Top Products ─────────────────────────────────────────────────────
  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    where: {
      order: {
        status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: startDate },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  const topProducts = topProductsRaw.map((p) => ({
    name: p.productName,
    sales: p._sum.quantity ?? 0,
    revenue: Number(p._sum.totalPrice ?? 0),
  }));

  // ─── Recent Orders ────────────────────────────────────────────────────
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  const formattedOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user.firstName
      ? `${o.user.firstName} ${o.user.lastName ?? ''}`.trim()
      : o.user.email,
    total: Number(o.total),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  // ─── Compose response ─────────────────────────────────────────────────
  const payload = {
    revenue: { total: revenueTotal, change: revenueChange },
    orders: { total: currentRevenue._count, change: ordersChange },
    customers: { total: totalCustomers, change: customersChange },
    products: { total: totalProducts, active: activeProducts },
    salesByDay,
    topProducts,
    recentOrders: formattedOrders,
  };

  // Cache the result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(payload));

  res.json({ success: true, data: payload });
};

// ─── Products Analytics ───────────────────────────────────────────────────────
export const getProductAnalytics = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const days = parseInt(req.query.days as string) || 30;

  const startDate = subDays(new Date(), days);

  const [views, orders, revenue, reviews] = await Promise.all([
    prisma.productView.count({
      where: { productId, createdAt: { gte: startDate } },
    }),
    prisma.orderItem.aggregate({
      where: {
        productId,
        order: {
          status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] },
          createdAt: { gte: startDate },
        },
      },
      _sum: { quantity: true, totalPrice: true },
    }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const conversionRate = views > 0
    ? ((orders._sum.quantity ?? 0) / views * 100).toFixed(2)
    : '0.00';

  res.json({
    success: true,
    data: {
      views,
      unitsSold: orders._sum.quantity ?? 0,
      revenue: Number(orders._sum.totalPrice ?? 0),
      conversionRate: `${conversionRate}%`,
      avgRating: reviews._avg.rating ?? 0,
      reviewCount: reviews._count,
    },
  });
};

// ─── User Analytics ───────────────────────────────────────────────────────────
export const getUserAnalytics = async (req: Request, res: Response) => {
  const [
    totalUsers,
    newThisMonth,
    bannedUsers,
    verifiedUsers,
    topSpenders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: startOfDay(subDays(new Date(), 30)) } },
    }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        orders: {
          where: { status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] } },
          select: { total: true },
        },
      },
    }),
  ]);

  const spendersWithTotal = topSpenders
    .map((u) => ({
      id: u.id,
      name: u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : u.email,
      totalSpent: u.orders.reduce((acc, o) => acc + Number(o.total), 0),
      orderCount: u.orders.length,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  res.json({
    success: true,
    data: {
      total: totalUsers,
      newThisMonth,
      banned: bannedUsers,
      verified: verifiedUsers,
      verificationRate: `${((verifiedUsers / totalUsers) * 100).toFixed(1)}%`,
      topSpenders: spendersWithTotal,
    },
  });
};

// ─── Revenue Report ───────────────────────────────────────────────────────────
export const getRevenueReport = async (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!from || !to) throw new AppError('Date range required', 400);

  const startDate = new Date(from as string);
  const endDate = new Date(to as string);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new AppError('Invalid date format', 400);
  }

  const orders = await prisma.order.groupBy({
    by: ['status'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { total: true, discountAmount: true, shippingCost: true },
    _count: true,
  });

  const totals = orders.reduce(
    (acc, o) => ({
      revenue: acc.revenue + Number(o._sum.total ?? 0),
      discounts: acc.discounts + Number(o._sum.discountAmount ?? 0),
      shipping: acc.shipping + Number(o._sum.shippingCost ?? 0),
      orders: acc.orders + o._count,
    }),
    { revenue: 0, discounts: 0, shipping: 0, orders: 0 }
  );

  res.json({
    success: true,
    data: {
      period: { from: startDate.toISOString(), to: endDate.toISOString() },
      byStatus: orders,
      totals,
      avgOrderValue: totals.orders > 0 ? totals.revenue / totals.orders : 0,
    },
  });
};
