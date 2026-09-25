import { ReviewsService } from './reviews.controller';

describe('ReviewsService', () => {
  it('only lets users review products from a delivered order', async () => {
    const prisma: any = {
      order: { findFirst: jest.fn(async () => null) },
      review: { upsert: jest.fn() },
    };
    const service = new ReviewsService(prisma);
    await expect(service.upsert(1, 5, { rating: 5 })).rejects.toThrow('รีวิวได้เฉพาะ');
    expect(prisma.order.findFirst).toHaveBeenCalledWith({
      where: { userId: 1, status: 'delivered', items: { some: { productId: 5 } } },
      select: { id: true },
    });

    prisma.order.findFirst.mockResolvedValue({ id: 1 });
    await service.upsert(1, 5, { rating: 4, comment: ' good ' });
    expect(prisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { rating: 4, comment: 'good', userId: 1, productId: 5 } }),
    );
  });
});
