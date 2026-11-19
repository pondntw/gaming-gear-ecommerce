import { AdminController, getPeriodStartDate } from './admin.controller';

describe('AdminController - period filtering', () => {
  describe('getPeriodStartDate', () => {
    it('returns undefined for empty or "all"', () => {
      expect(getPeriodStartDate()).toBeUndefined();
      expect(getPeriodStartDate('')).toBeUndefined();
      expect(getPeriodStartDate('all')).toBeUndefined();
    });

    it('returns approximately 1 day ago for "1d" or "1"', () => {
      const date1 = getPeriodStartDate('1d')!;
      const date2 = getPeriodStartDate('1')!;
      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(Math.abs(Date.now() - date1.getTime() - oneDayMs)).toBeLessThan(1000);
      expect(Math.abs(Date.now() - date2.getTime() - oneDayMs)).toBeLessThan(1000);
    });

    it('returns approximately 7 days ago for "7d" or "7"', () => {
      const date = getPeriodStartDate('7d')!;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(Math.abs(Date.now() - date.getTime() - sevenDaysMs)).toBeLessThan(1000);
    });

    it('returns approximately 14 days ago for "14d" or "14"', () => {
      const date = getPeriodStartDate('14d')!;
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      expect(Math.abs(Date.now() - date.getTime() - fourteenDaysMs)).toBeLessThan(1000);
    });

    it('returns approximately 30 days ago for "30d", "1m", or "30"', () => {
      const date1 = getPeriodStartDate('30d')!;
      const date2 = getPeriodStartDate('1m')!;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(Date.now() - date1.getTime() - thirtyDaysMs)).toBeLessThan(1000);
      expect(Math.abs(Date.now() - date2.getTime() - thirtyDaysMs)).toBeLessThan(1000);
    });
  });

  describe('stats endpoint', () => {
    let controller: AdminController;
    let prismaMock: any;

    beforeEach(() => {
      prismaMock = {
        user: {
          count: jest.fn().mockImplementation(({ where }: any) => {
            if (where?.createdAt?.gte) return Promise.resolve(5);
            return Promise.resolve(100);
          }),
        },
        product: {
          count: jest.fn().mockResolvedValue(20),
          findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Mouse', sku: 'MS-01', stockQuantity: 2 }]),
        },
        review: {
          count: jest.fn().mockResolvedValue(10),
        },
        order: {
          groupBy: jest.fn().mockResolvedValue([
            { status: 'processing', _count: { _all: 3 } },
            { status: 'delivered', _count: { _all: 7 } },
          ]),
          count: jest.fn().mockResolvedValue(4),
        },
        payment: {
          aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 12500 } }),
        },
      };

      controller = new AdminController(prismaMock);
    });

    it('returns unfiltered stats when period is "all" or omitted', async () => {
      const res = await controller.stats({});

      expect(res.period).toBe('all');
      expect(res.customers).toBe(100);
      expect(res.totalCustomers).toBe(100);
      expect(res.products).toBe(20);
      expect(res.revenue).toBe(12500);
      expect(res.ordersByStatus).toEqual({ processing: 3, delivered: 7 });
      expect(res.todoCount).toBe(4);

      // Verify order groupBy had no where date filter
      expect(prismaMock.order.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: undefined,
        _count: { _all: true },
      });

      // Verify payment aggregate had no paidAt filter
      expect(prismaMock.payment.aggregate).toHaveBeenCalledWith({
        where: { status: 'approved' },
        _sum: { amount: true },
      });
    });

    it('applies date filters when period is "7d"', async () => {
      const res = await controller.stats({ period: '7d' });

      expect(res.period).toBe('7d');
      expect(res.customers).toBe(5);
      expect(res.totalCustomers).toBe(100);

      // Verify order groupBy received orderDate filter
      const orderGroupByArgs = prismaMock.order.groupBy.mock.calls[0][0];
      expect(orderGroupByArgs.where.orderDate.gte).toBeInstanceOf(Date);

      // Verify payment aggregate received paidAt filter
      const paymentArgs = prismaMock.payment.aggregate.mock.calls[0][0];
      expect(paymentArgs.where.status).toBe('approved');
      expect(paymentArgs.where.paidAt.gte).toBeInstanceOf(Date);

      // Verify user count received createdAt filter for customers
      const userCountArgs = prismaMock.user.count.mock.calls[0][0];
      expect(userCountArgs.where.role).toBe('customer');
      expect(userCountArgs.where.createdAt.gte).toBeInstanceOf(Date);
    });
  });
});
