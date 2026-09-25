import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }) @MaxLength(72) newPassword: string;
}

const POSTAL_CODE = /^\d{5}$/;
const POSTAL_CODE_MSG = { message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก' };

export class AddressDto {
  @IsString() @MinLength(2) @MaxLength(100) recipientName: string;
  @IsString() @MinLength(9) @MaxLength(20) phone: string;
  /** House number / moo / soi / road. */
  @IsString() @MinLength(3) @MaxLength(300) addressLine: string;
  @IsString() @MinLength(2) @MaxLength(100) subdistrict: string;
  @IsString() @MinLength(2) @MaxLength(100) district: string;
  @IsString() @MinLength(2) @MaxLength(100) province: string;
  @Matches(POSTAL_CODE, POSTAL_CODE_MSG) postalCode: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) recipientName?: string;
  @IsOptional() @IsString() @MinLength(9) @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(300) addressLine?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) subdistrict?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) district?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) province?: string;
  @IsOptional() @Matches(POSTAL_CODE, POSTAL_CODE_MSG) postalCode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class AdminUpdateUserDto {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}
