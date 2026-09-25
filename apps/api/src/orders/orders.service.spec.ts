import { BadRequestException } from '@nestjs/common';
import { ADMIN_TRANSITIONS, orderTotals, shippingFee } from './order-rules';
import { OrdersService } from './orders.service';

describe('order rules', () => {
  it('charges shipping fees and makes standard free from 3000 THB', () => {
    expect(shippingFee('standard', 2999)).toBe(50);
    expect(shippingFee('standard', 3000)).toBe(0);
    expect(shippingFee('express', 5000)).toBe(100);
  });

  it('computes subtotal and total', () => {
    expect(
      orderTotals({ shippingFee: 50, items: [{ unitPrice: 100, quantity: 2 }, { unitPrice: '25.5', quantity: 2 }] }),
    ).toEqual({ subtotal: 251, total: 301 });
  });

  it('never allows leaving a terminal status', () => {
    expect(ADMIN_TRANSITIONS.delivered).toEqual([]);
    expect(ADMIN_TRANSITIONS.cancelled).toEqual([]);
  });
});

/** Minimal in-memory Prisma double covering what OrdersService uses. */
function makePrisma(opts: { stock: Record<number, number>; orderStatus?: string }) {
  const stock = { ...opts.stock };
  let orderStatus = opts.orderStatus ?? 'pending_payment';
  const cartItems = [
    { id: 1, cartId: 1, productId: 1, quantity: 2, product: { id: 1, name: 'Mouse', price: 1000, isActive: true } },
    { id: 2, cartId: 1, productId: 2, quantity: 1, product: { id: 2, name: 'Keyboard', price: 2500, isActive: true } },
  ];
  const createdOrders: any[] = [];

  const prisma: any = {
    cart: { findUnique: jest.fn(async () => ({ id: 1, items: cartItems })) },
    product: {
      updateMany: jest.fn(async ({ where, data }: any) => {
        if (stock[where.id] < where.stockQuantity.gte) return { count: 0 };
        stock[where.id] -= data.stockQuantity.decrement;
        return { count: 1 };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        stock[where.id] += data.stockQuantity.increment;
      }),
    },
    order: {
      create: jest.fn(async ({ data }: any) => {
        createdOrders.push(data);
        return { id: 99 };
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const allowed = where.status.in ?? [where.status];
        if (!allowed.includes(orderStatus)) return { count: 0 };
        orderStatus = data.status;
        return { count: 1 };
      }),
      findFirst: jest.fn(async () => ({
        id: 99,
        status: orderStatus,
        shippingFee: 0,
        items: [
          { productId: 1, quantity: 2, unitPrice: 1000 },
          { productId: 2, quantity: 1, unitPrice: 2500 },
        ],
        payments: [],
      })),
    },
    orderItem: {
      findMany: jest.fn(async () => [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ]),
    },
    cartItem: { deleteMany: jest.fn(async () => ({ count: 2 })) },
    payment: { updateMany: jest.fn(async () => ({ count: 0 })) },
    address: { findFirst: jest.fn() },
  };
  prisma.$transaction = jest.fn(async (fn: any) => fn(prisma));
  return { prisma, stock, createdOrders, status: () => orderStatus };
}

const storage: any = { signedUrl: jest.fn(async () => null) };
const shipping = { shippingName: 'Tester', shippingPhone: '0812345678', shippingAddress: '123 Test Road Bangkok' };

describe('OrdersService', () => {
  it('checkout decrements stock, snapshots prices, applies free shipping and clears the cart', async () => {
    const { prisma, stock, createdOrders } = makePrisma({ stock: { 1: 5, 2: 5 } });
    const service = new OrdersService(prisma, storage);

    const order = await service.checkout(7, { shippingMethod: 'standard', ...shipping });

    expect(stock).toEqual({ 1: 3, 2: 4 });
    expect(createdOrders[0].shippingFee).toBe(0); // subtotal 4500 >= 3000
    expect(createdOrders[0].items.create).toEqual([
      { productId: 1, quantity: 2, unitPrice: 1000 },
      { productId: 2, quantity: 1, unitPrice: 2500 },
    ]);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 1 } });
    expect(order.total).toBe(4500);
  });

  it('checkout with a saved address stores the formatted one-line address', async () => {
    const { prisma, createdOrders } = makePrisma({ stock: { 1: 5, 2: 5 } });
    prisma.address.findFirst.mockResolvedValue({
      recipientName: 'สมชาย',
      phone: '0812345678',
      addressLine: '99 ถ.พหลโยธิน',
      subdistrict: 'คลองหนึ่ง',
      district: 'คลองหลวง',
      province: 'ปทุมธานี',
      postalCode: '12120',
    });
    await new OrdersService(prisma, storage).checkout(7, { shippingMethod: 'standard', addressId: 3 });
    expect(prisma.address.findFirst).toHaveBeenCalledWith({ where: { id: 3, userId: 7 } });
    expect(createdOrders[0].shippingAddress).toBe('99 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120');
  });

  it('checkout fails when stock is insufficient', async () => {
    const { prisma } = makePrisma({ stock: { 1: 1, 2: 5 } });
    const service = new OrdersService(prisma, storage);
    await expect(service.checkout(7, { shippingMethod: 'express', ...shipping })).rejects.toThrow(BadRequestException);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('customer cancel restores stock', async () => {
    const { prisma, stock, status } = makePrisma({ stock: { 1: 0, 2: 0 }, orderStatus: 'pending_payment' });
    const service = new OrdersService(prisma, storage);
    await service.cancelMine(7, 99);
    expect(status()).toBe('cancelled');
    expect(stock).toEqual({ 1: 2, 2: 1 });
  });

  it('customer cannot cancel once the order has shipped', async () => {
    const { prisma, stock } = makePrisma({ stock: { 1: 0, 2: 0 }, orderStatus: 'shipped' });
    const service = new OrdersService(prisma, storage);
    await expect(service.cancelMine(7, 99)).rejects.toThrow(BadRequestException);
    expect(stock).toEqual({ 1: 0, 2: 0 });
  });

  it('admin cannot mark shipped without a tracking number', async () => {
    const { prisma } = makePrisma({ stock: {}, orderStatus: 'processing' });
    const service = new OrdersService(prisma, storage);
    await expect(service.adminUpdate(99, { status: 'shipped' })).rejects.toThrow('เลขพัสดุ');
  });

  it('admin cannot skip steps in the status flow', async () => {
    const { prisma } = makePrisma({ stock: {}, orderStatus: 'pending_payment' });
    const service = new OrdersService(prisma, storage);
    await expect(service.adminUpdate(99, { status: 'delivered' })).rejects.toThrow(BadRequestException);
  });
});
