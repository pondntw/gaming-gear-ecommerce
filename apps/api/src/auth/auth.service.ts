import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './auth.dto';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function toPublicUser(u: User) {
  return { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt };
}

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async session(user: User) {
    return { accessToken: await this.jwt.signAsync({ sub: user.id }), user: toPublicUser(user) };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    return this.session(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }

  /**
   * There is no email service, so the reset link is logged and (outside production)
   * returned in the response so the flow can be demoed.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const message = 'หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว';
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user) return { message };

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });
    const origin = this.config.get('WEB_ORIGIN', 'http://localhost:3000').split(',')[0];
    const resetUrl = `${origin}/reset-password?token=${token}`;
    this.logger.log(`Password reset link for ${user.email}: ${resetUrl}`);
    return process.env.NODE_ENV === 'production' ? { message } : { message, resetUrl };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await bcrypt.hash(dto.password, 10) },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
    return { message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว' };
  }
}
