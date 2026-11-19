'use client';

import { ChevronLeft, ChevronRight, Link2, Star, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import { ProductImage } from './ui';

export const MAX_IMAGES = 10; // matches MAX_PRODUCT_IMAGES in the API

/** Edits an ordered list of image URLs. The first image is the product's cover. */
export function GalleryEditor({
  images,
  onChange,
  category,
  onUploadingChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  category?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const { toast } = useStore();
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState('');
  const room = MAX_IMAGES - images.length;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const upload = async (files: FileList) => {
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast(`เพิ่มได้อีก ${room} รูป (สูงสุด ${MAX_IMAGES} รูป)`, 'error');
    if (!list.length) return;
    setUploading(list.length);
    onUploadingChange?.(true);
    // Upload in parallel but keep the order the files were picked in.
    const results = await Promise.all(
      list.map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
          return (await api.post<{ url: string }>('/admin/products/upload-image', fd)).url;
        } catch (e) {
          toast(`${file.name}: ${errorMessage(e)}`, 'error');
          return null;
        }
      }),
    );
    onChange([...images, ...results.filter((u): u is string => !!u)]);
    setUploading(0);
    onUploadingChange?.(false);
  };

  const addUrl = () => {
    const v = url.trim();
    if (!/^(https?:\/\/|\/(?!\/))\S+$/.test(v)) return toast('URL ต้องขึ้นต้นด้วย http(s):// หรือ /', 'error');
    if (images.includes(v)) return toast('มีรูปนี้อยู่แล้ว', 'error');
    onChange([...images, v]);
    setUrl('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label mb-0">
          รูปสินค้า ({images.length}/{MAX_IMAGES}) · รูปแรกคือรูปปก
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {images.map((src, i) => (
          <div
            key={src + i}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
              i === 0 ? 'border-accent' : 'border-line'
            }`}
          >
            <ProductImage src={src} category={category} alt={`รูปที่ ${i + 1}`} />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold">ปก</span>
            )}
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              aria-label={`ลบรูปที่ ${i + 1}`}
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 hover:bg-danger"
            >
              <X size={12} />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="เลื่อนไปทางซ้าย" className="disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {i !== 0 && (
                <button type="button" onClick={() => move(i, 0)} aria-label="ตั้งเป็นรูปปก" title="ตั้งเป็นรูปปก">
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                disabled={i === images.length - 1}
                onClick={() => move(i, i + 1)}
                aria-label="เลื่อนไปทางขวา"
                className="disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
        {room > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-xs text-muted hover:border-accent hover:text-accent">
            <Upload size={18} />
            {uploading ? `กำลังอัปโหลด ${uploading} รูป...` : 'อัปโหลดรูป'}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={!!uploading}
              onChange={(e) => {
                if (e.target.files?.length) upload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {room > 0 && (
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="หรือวาง URL รูปภาพ"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button type="button" className="btn-ghost shrink-0" onClick={addUrl} disabled={!url.trim()}>
            <Link2 size={15} /> เพิ่ม
          </button>
        </div>
      )}
    </div>
  );
}
