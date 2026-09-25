import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class AddItemDto {
  @Type(() => Number) @IsInt() productId: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(99) quantity: number;
}

class UpdateItemDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(99) quantity: number;
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async cartId(userId: number) {
    const cart = await this.prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
    return cart.id;
  }

  async get(userId: number) {
    const cartId = await this.cartId(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: { include: { category: true } } },
      orderBy: { id: 'asc' },
    });
    const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
    return {
      id: cartId,
      items: items.map((i) => ({
        ...i,
        // Flag lines that can't be checked out as-is so the UI can warn the user.
        available: i.product.isActive && i.product.stockQuantity >= i.quantity,
      })),
      subtotal,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
    };
  }

  private async assertStock(productId: number, quantity: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('ไม่พบสินค้า');
    if (product.stockQuantity < quantity) {
      throw new BadRequestException(`สินค้าคงเหลือไม่พอ (เหลือ ${product.stockQuantity} ชิ้น)`);
    }
  }

  async addItem(userId: number, dto: AddItemDto) {
    const cartId = await this.cartId(userId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId: dto.productId } },
    });
    const quantity = (existing?.quantity ?? 0) + dto.quantity;
    await this.assertStock(dto.productId, quantity);
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId: dto.productId } },
      update: { quantity },
      create: { cartId, productId: dto.productId, quantity },
    });
    return this.get(userId);
  }

  private async ownItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cart: { userId } } });
    if (!item) throw new NotFoundException('ไม่พบสินค้าในตะกร้า');
    return item;
  }

  async updateItem(userId: number, itemId: number, dto: UpdateItemDto) {
    const item = await this.ownItem(userId, itemId);
    await this.assertStock(item.productId, dto.quantity);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    return this.get(userId);
  }

  async removeItem(userId: number, itemId: number) {
    await this.ownItem(userId, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.get(userId);
  }
}

@Controller('cart')
@Auth()
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cart.get(user.id);
  }

  @Post('items')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddItemDto) {
    return this.cart.addItem(user.id, dto);
  }

  @Patch('items/:id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateItemDto) {
    return this.cart.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.cart.removeItem(user.id, id);
  }
}

@Module({ controllers: [CartController], providers: [CartService], exports: [CartService] })
export class CartModule {}
