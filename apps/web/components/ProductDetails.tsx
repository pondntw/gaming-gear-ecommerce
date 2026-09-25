import { Check } from 'lucide-react';
import type { Product } from '@/lib/types';

/** Long-form product content shown under the gallery: overview, highlights and a spec table. */
export function ProductDetails({ product }: { product: Product }) {
  const paragraphs = (product.details ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const highlights = product.highlights ?? [];
  const specs = product.specs ?? [];

  if (!paragraphs.length && !highlights.length && !specs.length) return null;

  return (
    <section className="space-y-10" aria-labelledby="product-details">
      {paragraphs.length > 0 && (
        <div className="space-y-4">
          <h2 id="product-details" className="section-title">รายละเอียดสินค้า</h2>
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line text-[17px] leading-relaxed text-ink/90">
              {p}
            </p>
          ))}
        </div>
      )}

      {highlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">จุดเด่น</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h} className="flex gap-3 rounded-2xl bg-surface p-4 text-[15px] leading-snug">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {specs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">ข้อมูลจำเพาะ</h3>
          <dl className="divide-y divide-line border-y border-line">
            {specs.map((s, i) => (
              <div key={s.label + i} className="grid gap-1 py-3.5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="text-[15px]">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
