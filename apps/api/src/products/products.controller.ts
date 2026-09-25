import {
  Body,
  Controller,
  Delete,
  Get,
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
import { Auth } from '../common/auth';
import { IMAGE_UPLOAD_OPTIONS, PRODUCT_IMAGES_BUCKET, StorageService } from '../storage/storage.service';
import {
  AdjustStockDto,
  AdminProductQueryDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './products.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  list(@Query() query: ProductQueryDto) {
    return this.products.list(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.products.detail(id);
  }
}

@Controller('admin/products')
@Auth('admin')
export class AdminProductsController {
  constructor(
    private products: ProductsService,
    private storage: StorageService,
  ) {}

  @Get()
  list(@Query() query: AdminProductQueryDto) {
    return this.products.adminList(query);
  }

  @Get(':id')
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.products.detail(id, true);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.products.deactivate(id);
  }

  @Patch(':id/stock')
  adjustStock(@Param('id', ParseIntPipe) id: number, @Body() dto: AdjustStockDto) {
    return this.products.adjustStock(id, dto);
  }

  /** Uploads an image to Supabase Storage and returns its public URL for `imageUrl`. */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const path = await this.storage.uploadImage(PRODUCT_IMAGES_BUCKET, 'products', file);
    return { url: this.storage.publicUrl(PRODUCT_IMAGES_BUCKET, path) };
  }
}

@Module({ controllers: [ProductsController, AdminProductsController], providers: [ProductsService] })
export class ProductsModule {}
