import { ProductsService } from './products.service';

function makePrisma() {
  const prisma: any = {
    product: { create: jest.fn(async (args: any) => args), update: jest.fn(async (args: any) => args) },
    productImage: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  prisma.$transaction = jest.fn(async (fn: any) => fn(prisma));
  return prisma;
}

describe('ProductsService gallery', () => {
  it('create stores the gallery in order and uses the first image as the cover', async () => {
    const prisma = makePrisma();
    await new ProductsService(prisma).create({
      sku: 'ms-9',
      name: 'Mouse',
      price: 1,
      stockQuantity: 1,
      images: ['/a.jpg', '/b.jpg'],
    });
    const { data } = prisma.product.create.mock.calls[0][0];
    expect(data.sku).toBe('MS-9');
    expect(data.imageUrl).toBe('/a.jpg');
    expect(data.images.create).toEqual([
      { url: '/a.jpg', sortOrder: 0 },
      { url: '/b.jpg', sortOrder: 1 },
    ]);
  });

  it('update replaces the whole gallery and resets the cover', async () => {
    const prisma = makePrisma();
    await new ProductsService(prisma).update(5, { images: ['/c.jpg', '/a.jpg'] });
    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({ where: { productId: 5 } });
    expect(prisma.productImage.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 5, url: '/c.jpg', sortOrder: 0 },
        { productId: 5, url: '/a.jpg', sortOrder: 1 },
      ],
    });
    expect(prisma.product.update.mock.calls[0][0].data.imageUrl).toBe('/c.jpg');
  });

  it('an empty gallery clears the cover', async () => {
    const prisma = makePrisma();
    await new ProductsService(prisma).update(5, { images: [] });
    expect(prisma.product.update.mock.calls[0][0].data.imageUrl).toBeNull();
  });

  it('update without images leaves the gallery and cover untouched', async () => {
    const prisma = makePrisma();
    await new ProductsService(prisma).update(5, { price: 10 });
    expect(prisma.productImage.deleteMany).not.toHaveBeenCalled();
    expect(prisma.product.update.mock.calls[0][0].data).not.toHaveProperty('imageUrl');
  });
});
