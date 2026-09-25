import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { toPublicUser } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddressDto, AdminUpdateUserDto, ChangePasswordDto, UpdateAddressDto, UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return toPublicUser(await this.prisma.user.update({ where: { id: userId }, data: dto }));
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('รหัสผ่านปัจจุบันไม่ถูกต้อง');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' };
  }

  // ----- addresses -----

  listAddresses(userId: number) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] });
  }

  async createAddress(userId: number, dto: AddressDto) {
    const isFirst = (await this.prisma.address.count({ where: { userId } })) === 0;
    const isDefault = dto.isDefault || isFirst;
    return this.prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({ data: { ...dto, userId, isDefault } });
    });
  }

  async updateAddress(userId: number, id: number, dto: UpdateAddressDto) {
    await this.ownAddress(userId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: dto });
    });
  }

  async deleteAddress(userId: number, id: number) {
    const address = await this.ownAddress(userId, id);
    await this.prisma.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({ where: { userId }, orderBy: { id: 'asc' } });
      if (next) await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { ok: true };
  }

  private async ownAddress(userId: number, id: number) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('ไม่พบที่อยู่');
    return address;
  }

  // ----- admin -----

  async adminList(q?: string) {
    const users = await this.prisma.user.findMany({
      where: q
        ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }
        : undefined,
      orderBy: { id: 'asc' },
      include: { _count: { select: { orders: true } } },
    });
    return users.map((u) => ({ ...toPublicUser(u), orderCount: u._count.orders }));
  }

  async adminUpdate(actorId: number, id: number, dto: AdminUpdateUserDto) {
    if (id === actorId && dto.role && dto.role !== 'admin') {
      throw new BadRequestException('ไม่สามารถลดสิทธิ์บัญชีของตัวเองได้');
    }
    await this.prisma.user.findUniqueOrThrow({ where: { id } });
    return toPublicUser(await this.prisma.user.update({ where: { id }, data: dto }));
  }

  async adminDelete(actorId: number, id: number) {
    if (id === actorId) throw new BadRequestException('ไม่สามารถลบบัญชีของตัวเองได้');
    await this.prisma.user.findUniqueOrThrow({ where: { id } });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
