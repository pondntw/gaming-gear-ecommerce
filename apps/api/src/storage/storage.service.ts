import {
  BadRequestException,
  Global,
  Injectable,
  Module,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const PRODUCT_IMAGES_BUCKET = 'product-images'; // public bucket
export const PAYMENT_SLIPS_BUCKET = 'payment-slips'; // private bucket

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Options for FileInterceptor so oversized uploads are rejected before buffering. */
export const IMAGE_UPLOAD_OPTIONS = { limits: { fileSize: MAX_IMAGE_BYTES } };
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function assertImage(file?: Express.Multer.File): Express.Multer.File {
  if (!file) throw new BadRequestException('กรุณาเลือกไฟล์รูปภาพ');
  if (!IMAGE_TYPES[file.mimetype]) throw new BadRequestException('รองรับเฉพาะไฟล์ JPG, PNG, WEBP');
  if (file.size > MAX_IMAGE_BYTES) throw new BadRequestException('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
  return file;
}

@Injectable()
export class StorageService {
  private client?: SupabaseClient;

  constructor(private config: ConfigService) {}

  private get supabase(): SupabaseClient {
    if (!this.client) {
      const url = this.config.get<string>('SUPABASE_URL');
      const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      if (!url || !key) {
        throw new ServiceUnavailableException('ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
      }
      this.client = createClient(url, key, { auth: { persistSession: false } });
    }
    return this.client;
  }

  /** Uploads an image and returns its object path inside the bucket. */
  async uploadImage(bucket: string, folder: string, file: Express.Multer.File): Promise<string> {
    assertImage(file);
    const path = `${folder}/${randomUUID()}.${IMAGE_TYPES[file.mimetype]}`;
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw new ServiceUnavailableException(`อัปโหลดไฟล์ไม่สำเร็จ: ${error.message}`);
    return path;
  }

  publicUrl(bucket: string, path: string): string {
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /** Signed URL for private objects (payment slips); null if storage is unavailable. */
  async signedUrl(bucket: string, path: string | null): Promise<string | null> {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    try {
      const { data } = await this.supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    } catch {
      return null;
    }
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
