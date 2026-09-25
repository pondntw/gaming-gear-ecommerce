import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { IMAGE_UPLOAD_OPTIONS } from '../storage/storage.service';
import { FREE_SHIPPING_MIN, PAYMENT_METHODS, SHIPPING_METHODS } from './order-rules';
import { AdminOrderQueryDto, AdminUpdateOrderDto, CheckoutDto, PaymentDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  /** Public: lets the checkout page show methods and fees without hardcoding them. */
  @Get('options')
  options() {
    return { shippingMethods: SHIPPING_METHODS, paymentMethods: PAYMENT_METHODS, freeShippingMin: FREE_SHIPPING_MIN };
  }

  @Post('checkout')
  @Auth()
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.orders.checkout(user.id, dto);
  }

  @Get()
  @Auth()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user.id);
  }

  @Get(':id')
  @Auth()
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.getMine(user.id, id);
  }

  @Post(':id/cancel')
  @Auth()
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancelMine(user.id, id);
  }

  @Post(':id/payment')
  @Auth()
  @UseInterceptors(FileInterceptor('slip', IMAGE_UPLOAD_OPTIONS))
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PaymentDto,
    @UploadedFile() slip: Express.Multer.File,
  ) {
    return this.orders.submitPayment(user.id, id, dto, slip);
  }
}

@Controller('admin')
@Auth('admin')
export class AdminOrdersController {
  constructor(private orders: OrdersService) {}

  @Get('orders')
  list(@Query() query: AdminOrderQueryDto) {
    return this.orders.adminList(query);
  }

  @Get('orders/:id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.orders.adminGet(id);
  }

  @Patch('orders/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateOrderDto) {
    return this.orders.adminUpdate(id, dto);
  }

  @Post('payments/:id/approve')
  @HttpCode(200)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.orders.reviewPayment(id, true);
  }

  @Post('payments/:id/reject')
  @HttpCode(200)
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.orders.reviewPayment(id, false);
  }
}

@Module({ controllers: [OrdersController, AdminOrdersController], providers: [OrdersService] })
export class OrdersModule {}
