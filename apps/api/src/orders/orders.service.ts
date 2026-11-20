import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { formatAddress } from '../users/address-format';
import { PAYMENT_SLIPS_BUCKET, StorageService } from '../storage/storage.service';
import { ADMIN_TRANSITIONS, CUSTOMER_CANCELLABLE, orderTotals, shippingFee } from './order-rules';
import { AdminOrderQueryDto, AdminUpdateOrderDto, CheckoutDto, PaymentDto } from './orders.dto';

const ORDER_INCLUDE = {
  items: { include: { product: { select: { id: true, name: true, sku: true, imageUrl: true } } } },
  payments: { orderBy: { id: 'desc' } },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private async present(order: OrderWithRelations) {
    const payments = await Promise.all(
      order.payments.map(async (p) => ({
        ...p,
        proofUrl: await this.storage.signedUrl(PAYMENT_SLIPS_BUCKET, p.proofUrl),
      })),
    );
    return { ...order, payments, ...orderTotals(order) };
  }

  private async load(where: Prisma.OrderWhereInput) {
    const order = await this.prisma.order.findFirst({ where, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('ไม่พบคำสั่งซื้อ');
    return order;
  }

  // ----- customer -----

  async checkout(userId: number, dto: CheckoutDto) {
    let shipping = { name: dto.shippingName, phone: dto.shippingPhone, address: dto.shippingAddress };
    if (dto.addressId) {
      const a = await this.prisma.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!a) throw new NotFoundException('ไม่พบที่อยู่');
      shipping = { name: a.recipientName, phone: a.phone, address: formatAddress(a) };
    }

    const orderId = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart?.items.length) throw new BadRequestException('ตะกร้าสินค้าว่างอยู่');

      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new BadRequestException(`สินค้า ${item.product.name} ไม่มีจำหน่ายแล้ว`);
        }
        if (item.product.stockQuantity < item.quantity) {
          throw new BadRequestException(`สินค้า ${item.product.name} มีไม่พอ (คงเหลือ ${item.product.stockQuantity} ชิ้น)`);
        }
      }

      const subtotal = cart.items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
      const order = await tx.order.create({
        data: {
          userId,
          shippingName: shipping.name!,
          shippingPhone: shipping.phone!,
          shippingAddress: shipping.address!,
          shippingMethod: dto.shippingMethod,
          shippingFee: shippingFee(dto.shippingMethod, subtotal),
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.product.price,
            })),
          },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order.id;
    });

    return this.present(await this.load({ id: orderId }));
  }

  async listMine(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { id: 'desc' },
    });
    return orders.map((o) => ({ ...o, ...orderTotals(o) }));
  }

  async getMine(userId: number, id: number) {
    return this.present(await this.load({ id, userId }));
  }

  async cancelMine(userId: number, id: number) {
    await this.load({ id, userId });
    await this.cancel(id, CUSTOMER_CANCELLABLE, 'ไม่สามารถยกเลิกคำสั่งซื้อที่กำลังจัดส่งหรือจัดส่งแล้วได้');
    return this.getMine(userId, id);
  }

  async submitPayment(userId: number, id: number, dto: PaymentDto, slip: Express.Multer.File) {
    const order = await this.load({ id, userId });
    if (order.status !== 'pending_payment') throw new BadRequestException('คำสั่งซื้อนี้ไม่ได้รอการชำระเงิน');

    const path = await this.storage.uploadImage(PAYMENT_SLIPS_BUCKET, `orders/${id}`, slip);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id, status: 'pending_payment' },
        data: { status: 'payment_review' },
      });
      if (!count) throw new BadRequestException('คำสั่งซื้อนี้ไม่ได้รอการชำระเงิน');
      await tx.payment.create({
        data: { orderId: id, paymentMethod: dto.paymentMethod, amount: orderTotals(order).total, proofUrl: path },
      });
    });
    return this.getMine(userId, id);
  }

  /**
   * Moves an order to `cancelled` only if it is still in one of `from`.
   * Returns items to stock only if the order had already been shipped.
   */
  private async cancel(id: number, from: OrderStatus[], errorMessage: string) {
    const orderBefore = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!orderBefore || !from.includes(orderBefore.status)) {
      throw new BadRequestException(errorMessage);
    }
    const wasShipped = orderBefore.status === 'shipped' || orderBefore.status === 'delivered';

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      if (wasShipped) {
        for (const item of orderBefore.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      await tx.payment.updateMany({ where: { orderId: id, status: 'pending' }, data: { status: 'rejected' } });
    });
  }

  // ----- admin -----

  async adminList(query: AdminOrderQueryDto) {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.q) {
      const asId = Number(query.q.replace(/^#/, ''));
      where.OR = [
        ...(Number.isInteger(asId) && asId > 0 ? [{ id: asId }] : []),
        { shippingName: { contains: query.q, mode: 'insensitive' } },
        { user: { email: { contains: query.q, mode: 'insensitive' } } },
        { trackingNumber: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const orders = await this.prisma.order.findMany({ where, include: ORDER_INCLUDE, orderBy: { id: 'desc' } });
    return orders.map((o) => ({ ...o, ...orderTotals(o) }));
  }

  async adminGet(id: number) {
    return this.present(await this.load({ id }));
  }

  async adminUpdate(id: number, dto: AdminUpdateOrderDto) {
    const order = await this.load({ id });
    const trackingNumber = dto.trackingNumber?.trim() || undefined;

    if (dto.status && dto.status !== order.status) {
      if (!ADMIN_TRANSITIONS[order.status].includes(dto.status)) {
        throw new BadRequestException(`ไม่สามารถเปลี่ยนสถานะจาก ${order.status} เป็น ${dto.status} ได้`);
      }
      if (dto.status === 'cancelled') {
        await this.cancel(id, [order.status], 'สถานะคำสั่งซื้อเปลี่ยนไปแล้ว กรุณารีเฟรช');
        return this.adminGet(id);
      }
      if (dto.status === 'shipped') {
        const finalTracking = trackingNumber ?? order.trackingNumber;
        if (!finalTracking) {
          throw new BadRequestException('กรุณาระบุเลขพัสดุก่อนเปลี่ยนเป็นจัดส่งแล้ว');
        }
        // ตอนส่งของ: ตัดสต็อกสินค้าโดยอัตโนมัติ
        await this.prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const { count } = await tx.product.updateMany({
              where: { id: item.productId, stockQuantity: { gte: item.quantity } },
              data: { stockQuantity: { decrement: item.quantity } },
            });
            if (!count) {
              const p = await tx.product.findUnique({ where: { id: item.productId } });
              throw new BadRequestException(
                `สินค้า ${p?.name ?? item.productId} มีสต็อกไม่พอสำหรับการจัดส่ง (ต้องการ ${item.quantity} ชิ้น)`,
              );
            }
          }
          await tx.order.update({
            where: { id },
            data: { status: 'shipped', trackingNumber: finalTracking },
          });
        });
        return this.adminGet(id);
      }
      if (dto.status === 'processing') {
        // Moving out of payment review manually counts as approving the pending slip.
        await this.prisma.payment.updateMany({ where: { orderId: id, status: 'pending' }, data: { status: 'approved' } });
      }
    } else if (order.status === 'cancelled') {
      throw new BadRequestException('คำสั่งซื้อนี้ถูกยกเลิกแล้ว');
    }

    await this.prisma.order.update({ where: { id }, data: { status: dto.status, trackingNumber } });
    return this.adminGet(id);
  }

  async reviewPayment(paymentId: number, approve: boolean) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('ไม่พบข้อมูลการชำระเงิน');
    if (payment.status !== 'pending') throw new BadRequestException('รายการนี้ถูกตรวจสอบไปแล้ว');

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: payment.orderId, status: 'payment_review' },
        data: { status: approve ? 'processing' : 'pending_payment' },
      });
      if (!count) throw new BadRequestException('คำสั่งซื้อไม่ได้อยู่ในสถานะรอตรวจสอบการชำระเงิน');
      await tx.payment.update({ where: { id: paymentId }, data: { status: approve ? 'approved' : 'rejected' } });
    });
    return this.adminGet(payment.orderId);
  }
}
