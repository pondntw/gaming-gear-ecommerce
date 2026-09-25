'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/lib/types';
import { ProductImage } from './ui';

/** Large image with arrows, dots and a thumbnail strip. Falls back to the cover when there is no gallery. */
export function ProductGallery({ product }: { product: Product }) {
  const urls = product.images?.length ? product.images.map((i) => i.url) : product.imageUrl ? [product.imageUrl] : [];
  const [index, setIndex] = useState(0);
  const current = urls[index] ?? null;
  const go = (step: number) => setIndex((i) => (i + step + urls.length) % urls.length);

  const arrow =
    'absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-0';

  return (
    <div className="space-y-4">
      <div className="card relative aspect-square overflow-hidden">
        <ProductImage
          src={current}
          category={product.category?.name}
          alt={`${product.name} รูปที่ ${index + 1}`}
        />
        {urls.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="รูปก่อนหน้า" className={`${arrow} left-4`}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => go(1)} aria-label="รูปถัดไป" className={`${arrow} right-4`}>
              <ChevronRight size={18} />
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
              {urls.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-ink' : 'w-1.5 bg-ink/25'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex justify-center gap-3 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setIndex(i)}
              aria-label={`ดูรูปที่ ${i + 1}`}
              aria-current={i === index}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white transition ${
                i === index ? 'ring-2 ring-accent' : 'opacity-60 ring-1 ring-line hover:opacity-100'
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
