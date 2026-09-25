import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name', 'rating'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Absolute http(s) URL (e.g. Supabase Storage) or a path served by the web app (e.g. /products/ms-001.jpg). */
const IMAGE_URL = /^(https?:\/\/|\/(?!\/))\S+$/;
const IMAGE_URL_MSG = { each: true, message: 'รูปสินค้าต้องเป็น URL (http/https) หรือ path ที่ขึ้นต้นด้วย /' };
export const MAX_PRODUCT_IMAGES = 10;

/** One row of the product spec table, e.g. { label: 'น้ำหนัก', value: '60 กรัม' }. */
export class SpecDto {
  @IsString() @MinLength(1) @MaxLength(60) label: string;
  @IsString() @MinLength(1) @MaxLength(300) value: string;
}

const toBool = ({ value }: { value: unknown }) => value === true || value === 'true' || value === '1';

export class ProductQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @Transform(toBool) @IsBoolean() inStock?: boolean;
  @IsOptional() @IsIn(PRODUCT_SORTS) sort?: ProductSort;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class AdminProductQueryDto extends ProductQueryDto {
  @IsOptional() @IsIn(['active', 'inactive', 'all']) status?: 'active' | 'inactive' | 'all';
}

export class CreateProductDto {
  @IsString() @MinLength(1) @MaxLength(40) sku: string;
  @IsString() @MinLength(1) @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price: number;
  @Type(() => Number) @IsInt() @Min(0) stockQuantity: number;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number | null;
  /** Gallery in display order; the first one becomes the cover (products.image_url). */
  @IsOptional() @IsArray() @ArrayMaxSize(MAX_PRODUCT_IMAGES) @Matches(IMAGE_URL, IMAGE_URL_MSG) images?: string[];
  /** Long overview shown under the gallery; blank lines separate paragraphs. */
  @IsOptional() @IsString() @MaxLength(20000) details?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(300, { each: true }) highlights?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => SpecDto) specs?: SpecDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) sku?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number | null;
  /** Gallery in display order; the first one becomes the cover (products.image_url). */
  @IsOptional() @IsArray() @ArrayMaxSize(MAX_PRODUCT_IMAGES) @Matches(IMAGE_URL, IMAGE_URL_MSG) images?: string[];
  /** Long overview shown under the gallery; blank lines separate paragraphs. */
  @IsOptional() @IsString() @MaxLength(20000) details?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(300, { each: true }) highlights?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => SpecDto) specs?: SpecDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** Either set an absolute stock level or adjust by a delta (e.g. +10 on restock). */
export class AdjustStockDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) set?: number;
  @IsOptional() @Type(() => Number) @IsInt() delta?: number;
}
