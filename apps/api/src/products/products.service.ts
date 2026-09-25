import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdjustStockDto,
  AdminProductQueryDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './products.dto';

const ORDER_BY: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { id: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name: { name: 'asc' },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private buildWhere(query: ProductQueryDto, isActive?: boolean): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { category: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { gte: query.minPrice, lte: query.maxPrice };
    }
    if (query.inStock) where.stockQuantity = { gt: 0 };
    return where;
  }

  private async ratings(productIds: number[]) {
    if (!productIds.length) return new Map<number, { avg: number; count: number }>();
    const rows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
  }

  private async search(query: ProductQueryDto, where: Prisma.ProductWhereInput, withImages = false) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const include = {
      category: true,
      ...(withImages && { images: { orderBy: { sortOrder: 'asc' as const } } }),
    };

    if (query.sort === 'rating') {
      // Ratings live in another table, so sort in memory (the catalog is small).
      const all = await this.prisma.product.findMany({ where, include });
      const ratings = await this.ratings(all.map((p) => p.id));
      const items = all
        .map((p) => ({ ...p, rating: ratings.get(p.id) ?? { avg: 0, count: 0 } }))
        .sort((a, b) => b.rating.avg - a.rating.avg || b.rating.count - a.rating.count);
      return { items: items.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, pageSize };
    }

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include,
        orderBy: ORDER_BY[query.sort ?? 'newest'],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);
    const ratings = await this.ratings(products.map((p) => p.id));
    const items = products.map((p) => ({ ...p, rating: ratings.get(p.id) ?? { avg: 0, count: 0 } }));
    return { items, total, page, pageSize };
  }

  list(query: ProductQueryDto) {
    return this.search(query, this.buildWhere(query, true));
  }

  adminList(query: AdminProductQueryDto) {
    const status = query.status ?? 'all';
    const isActive = status === 'all' ? undefined : status === 'active';
    return this.search(query, this.buildWhere(query, isActive), true);
  }

  async detail(id: number, includeInactive = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product || (!product.isActive && !includeInactive)) throw new NotFoundException('ไม่พบสินค้า');
    const rating = (await this.ratings([id])).get(id) ?? { avg: 0, count: 0 };
    return { ...product, rating };
  }

  create({ images, ...dto }: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        sku: dto.sku.trim().toUpperCase(),
        imageUrl: images?.[0] ?? null,
        images: images && { create: images.map((url, sortOrder) => ({ url, sortOrder })) },
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  /** When `images` is sent it replaces the whole gallery (order included) and resets the cover. */
  update(id: number, { images, ...dto }: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({ data: images.map((url, sortOrder) => ({ productId: id, url, sortOrder })) });
      }
      return tx.product.update({
        where: { id },
        data: { ...dto, sku: dto.sku?.trim().toUpperCase(), ...(images && { imageUrl: images[0] ?? null }) },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  /** Soft delete: products referenced by past orders must stay in the DB. */
  async deactivate(id: number) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    await this.prisma.cartItem.deleteMany({ where: { productId: id } });
    return { ok: true };
  }

  async adjustStock(id: number, dto: AdjustStockDto) {
    if ((dto.set === undefined) === (dto.delta === undefined)) {
      throw new BadRequestException('ระบุ set หรือ delta อย่างใดอย่างหนึ่ง');
    }
    if (dto.set !== undefined) {
      return this.prisma.product.update({ where: { id }, data: { stockQuantity: dto.set } });
    }
    const delta = dto.delta!;
    // Conditional update so a negative delta can never push stock below zero.
    const { count } = await this.prisma.product.updateMany({
      where: { id, stockQuantity: { gte: Math.max(0, -delta) } },
      data: { stockQuantity: { increment: delta } },
    });
    if (!count) throw new BadRequestException('สต็อกไม่พอสำหรับการปรับลด');
    return this.prisma.product.findUniqueOrThrow({ where: { id } });
  }
}
