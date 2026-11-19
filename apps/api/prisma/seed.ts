import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ADMIN, CATEGORIES, PRODUCTS } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: {},
    create: {
      fullName: ADMIN.fullName,
      email: ADMIN.email,
      phone: ADMIN.phone,
      role: 'admin',
      passwordHash: await bcrypt.hash(ADMIN.password, 10),
    },
  });

  const categoryIds = new Map<string, number>();
  for (const name of CATEGORIES) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categoryIds.set(name, c.id);
  }

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        stockQuantity: p.stock,
        imageUrl: p.images[0] ?? null,
        details: p.details ?? '',
        highlights: p.highlights ?? [],
        specs: p.specs ?? [],
        images: { create: p.images.map((url, sortOrder) => ({ url, sortOrder })) },
        categoryId: categoryIds.get(p.category),
      },
    });
  }
  console.log(`Seeded admin, ${CATEGORIES.length} categories, ${PRODUCTS.length} products`);
}

main().finally(() => prisma.$disconnect());
