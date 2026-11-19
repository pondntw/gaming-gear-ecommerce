import { Controller, Get, Module, Query } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { Auth } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

export class AdminStatsQueryDto {
  @IsOptional()
  @IsString()
  period?: string;
}

/**
 * Resolves a date cutoff based on a period key (e.g. '1d', '7d', '14d', '30d', '1m', 'all').
 * Returns undefined for 'all' or empty input (meaning all-time).
 */
export function getPeriodStartDate(period?: string): Date | undefined {
  if (!period || period === 'all') return undefined;
  const now = Date.now();
  if (period === '1d' || period === '1') {
    return new Date(now - 1 * 24 * 60 * 60 * 1000);
  }
  if (period === '7d' || period === '7') {
    return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === '14d' || period === '14') {
    return new Date(now - 14 * 24 * 60 * 60 * 1000);
  }
  if (period === '30d' || period === '1m' || period === '30') {
    return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  const matchDays = period.match(/^(\d+)d?$/);
  if (matchDays) {
    const days = parseInt(matchDays[1], 10);
    if (!isNaN(days) && days > 0) return new Date(now - days * 24 * 60 * 60 * 1000);
  }
  const matchMonths = period.match(/^(\d+)m$/);
  if (matchMonths) {
    const months = parseInt(matchMonths[1], 10);
    if (!isNaN(months) && months > 0) return new Date(now - months * 30 * 24 * 60 * 60 * 1000);
  }
  return undefined;
}

@Controller('admin')
@Auth('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async stats(@Query() query: AdminStatsQueryDto) {
    const startDate = getPeriodStartDate(query.period);
    const orderWhere = startDate ? { orderDate: { gte: startDate } } : undefined;
    const paymentWhere = {
      status: 'approved' as const,
      ...(startDate ? { paidAt: { gte: startDate } } : {}),
    };

    const [users, totalCustomers, products, reviews, byStatus, revenue, lowStock, todoCount] = await Promise.all([
      this.prisma.user.count({
        where: {
          role: 'customer',
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
      }),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.review.count({
        where: startDate ? { createdAt: { gte: startDate } } : {},
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stockQuantity: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: { stockQuantity: 'asc' },
        select: { id: true, name: true, sku: true, stockQuantity: true },
      }),
      this.prisma.order.count({
        where: { status: { in: ['payment_review', 'processing'] } },
      }),
    ]);

    return {
      period: query.period || 'all',
      customers: users,
      totalCustomers,
      products,
      reviews,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      revenue: Number(revenue._sum.amount ?? 0),
      lowStock,
      todoCount,
    };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
