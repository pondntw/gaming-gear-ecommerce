import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class ReviewDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

class AdminReviewQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() productId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
}

const USER_SELECT = { select: { id: true, fullName: true } };

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /** Only customers who received the product (a delivered order containing it) may review it. */
  async canReview(userId: number, productId: number): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: { userId, status: 'delivered', items: { some: { productId } } },
      select: { id: true },
    });
    return !!order;
  }

  listForProduct(productId: number) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: USER_SELECT },
      orderBy: { createdAt: 'desc' },
    });
  }

  async mine(userId: number, productId: number) {
    const [eligible, review] = await Promise.all([
      this.canReview(userId, productId),
      this.prisma.review.findUnique({ where: { userId_productId: { userId, productId } } }),
    ]);
    return { eligible, review };
  }

  async upsert(userId: number, productId: number, dto: ReviewDto) {
    if (!(await this.canReview(userId, productId))) {
      throw new ForbiddenException('รีวิวได้เฉพาะสินค้าที่ได้รับแล้วเท่านั้น');
    }
    const data = { rating: dto.rating, comment: dto.comment?.trim() ?? '' };
    return this.prisma.review.upsert({
      where: { userId_productId: { userId, productId } },
      update: data,
      create: { ...data, userId, productId },
      include: { user: USER_SELECT },
    });
  }

  async removeMine(userId: number, productId: number) {
    await this.prisma.review.delete({ where: { userId_productId: { userId, productId } } });
    return { ok: true };
  }
}

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Get()
  list(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviews.listForProduct(productId);
  }

  @Get('mine')
  @Auth()
  mine(@CurrentUser() user: AuthUser, @Param('productId', ParseIntPipe) productId: number) {
    return this.reviews.mine(user.id, productId);
  }

  /** Creates the user's review or edits it if one exists (one review per user per product). */
  @Put('mine')
  @Auth()
  upsert(@CurrentUser() user: AuthUser, @Param('productId', ParseIntPipe) productId: number, @Body() dto: ReviewDto) {
    return this.reviews.upsert(user.id, productId, dto);
  }

  @Delete('mine')
  @Auth()
  remove(@CurrentUser() user: AuthUser, @Param('productId', ParseIntPipe) productId: number) {
    return this.reviews.removeMine(user.id, productId);
  }
}

@Controller('admin/reviews')
@Auth('admin')
export class AdminReviewsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query() query: AdminReviewQueryDto) {
    return this.prisma.review.findMany({
      where: { productId: query.productId, rating: query.rating },
      include: { user: USER_SELECT, product: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }
}

@Module({
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
