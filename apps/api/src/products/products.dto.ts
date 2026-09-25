import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name', 'rating'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

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
  @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) sku?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @Type(() => Number) @IsInt() categoryId?: number | null;
  @IsOptional() @IsUrl({ require_tld: false }) imageUrl?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** Either set an absolute stock level or adjust by a delta (e.g. +10 on restock). */
export class AdjustStockDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) set?: number;
  @IsOptional() @Type(() => Number) @IsInt() delta?: number;
}
