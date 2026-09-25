import { Body, Controller, Delete, Get, Module, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { AddressDto, AdminUpdateUserDto, ChangePasswordDto, UpdateAddressDto, UpdateProfileDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('me')
@Auth()
export class MeController {
  constructor(private users: UsersService) {}

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, dto);
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthUser) {
    return this.users.listAddresses(user.id);
  }

  @Post('addresses')
  createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    return this.users.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  updateAddress(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAddressDto) {
    return this.users.updateAddress(user.id, id, dto);
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.users.deleteAddress(user.id, id);
  }
}

@Controller('admin/users')
@Auth('admin')
export class AdminUsersController {
  constructor(private users: UsersService) {}

  @Get()
  list(@Query('q') q?: string) {
    return this.users.adminList(q);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateUserDto) {
    return this.users.adminUpdate(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.users.adminDelete(user.id, id);
  }
}

@Module({ controllers: [MeController, AdminUsersController], providers: [UsersService] })
export class UsersModule {}
