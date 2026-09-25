import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(100) fullName: string;
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' }) email: string;
  @IsString() @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }) @MaxLength(72) password: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' }) email: string;
  @IsString() password: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' }) email: string;
}

export class ResetPasswordDto {
  @IsString() token: string;
  @IsString() @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }) @MaxLength(72) password: string;
}
