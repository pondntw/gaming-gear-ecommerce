import { Body, Controller, Delete, Get, Module, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Auth } from '../common/auth';
import { PrismaService } from '../prisma/prisma.service';

class CategoryDto {
  @IsString() @MinLength(1) @MaxLength(50) name: string;
}

@Controller('categories')
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return categories.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
  }
}

@Controller('admin/categories')
@Auth('admin')
export class AdminCategoriesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name.trim() } });
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CategoryDto) {
    return this.prisma.category.update({ where: { id }, data: { name: dto.name.trim() } });
  }

  /** Products in the category are kept, with category_id set to NULL. */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}

@Module({ controllers: [CategoriesController, AdminCategoriesController] })
export class CategoriesModule {}
