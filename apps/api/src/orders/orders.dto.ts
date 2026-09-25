import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { PAYMENT_METHODS, SHIPPING_METHODS } from './order-rules';

export class CheckoutDto {
  @IsIn(Object.keys(SHIPPING_METHODS)) shippingMethod: keyof typeof SHIPPING_METHODS;

  /** Use a saved address... */
  @IsOptional() @Type(() => Number) @IsInt() addressId?: number;

  /** ...or enter one directly. */
  @ValidateIf((o) => !o.addressId) @IsString() @MinLength(2) @MaxLength(100) shippingName?: string;
  @ValidateIf((o) => !o.addressId) @IsString() @MinLength(9) @MaxLength(20) shippingPhone?: string;
  @ValidateIf((o) => !o.addressId) @IsString() @MinLength(10) @MaxLength(500) shippingAddress?: string;
}

export class PaymentDto {
  @IsIn(Object.keys(PAYMENT_METHODS)) paymentMethod: keyof typeof PAYMENT_METHODS;
}

export class AdminOrderQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

export class AdminUpdateOrderDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsString() @MaxLength(100) trackingNumber?: string;
}
