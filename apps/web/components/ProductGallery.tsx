'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductImage } from './ui';

/** Main image with prev/next arrows and a thumbnail strip. Falls back to the cover when there is no gallery. */
export function ProductGallery({ product }: { product: Product }) {
  const urls = product.images?.length ? product.images.map((i) => i.url) : product.imageUrl ? [product.imageUrl] : [];
  const [index, setIndex] = useState(0);
  const current = urls[index] ?? null;
  const go = (step: number) => setIndex((i) => (i + step + urls.length) % urls.length);

  return (
    <div className="space-y-3">
      <div className="card group relative aspect-square overflow-hidden">
        <ProductImage src={current} category={product.category?.name} alt={`${product.name} รูปที่ ${index + 1}`} />
        {urls.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="รูปก่อนหน้า"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 opacity-80 transition hover:bg-black/80 hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="รูปถัดไป"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 opacity-80 transition hover:bg-black/80 hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs">
              {index + 1} / {urls.length}
            </span>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setIndex(i)}
              aria-label={`ดูรูปที่ ${i + 1}`}
              aria-current={i === index}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-neon-cyan shadow-[0_0_12px_rgb(34_227_255/0.5)]' : 'border-line opacity-70 hover:opacity-100'
              }`}
            >
              <ProductImage src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
