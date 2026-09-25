import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }) @MaxLength(72) newPassword: string;
}

export class AddressDto {
  @IsString() @MinLength(2) @MaxLength(100) recipientName: string;
  @IsString() @MinLength(9) @MaxLength(20) phone: string;
  @IsString() @MinLength(10) @MaxLength(500) addressLine: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) recipientName?: string;
  @IsOptional() @IsString() @MinLength(9) @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(500) addressLine?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class AdminUpdateUserDto {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}
