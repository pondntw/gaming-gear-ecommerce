import { Controller, Get, Module } from '@nestjs/common';
import { Auth } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

const LOW_STOCK_THRESHOLD = 5;

@Controller('admin')
@Auth('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  async stats() {
    const [users, products, reviews, byStatus, revenue, lowStock] = await Promise.all([
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.review.count(),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.payment.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
      this.prisma.product.findMany({
        where: { isActive: true, stockQuantity: { lt: LOW_STOCK_THRESHOLD } },
        orderBy: { stockQuantity: 'asc' },
        select: { id: true, name: true, sku: true, stockQuantity: true },
      }),
    ]);
    return {
      customers: users,
      products,
      reviews,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      revenue: Number(revenue._sum.amount ?? 0),
      lowStock,
    };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
