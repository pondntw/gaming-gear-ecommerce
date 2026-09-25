'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { Category, Paged, Product } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'ใหม่ล่าสุด' },
  { value: 'price_asc', label: 'ราคา: ต่ำไปสูง' },
  { value: 'price_desc', label: 'ราคา: สูงไปต่ำ' },
  { value: 'rating', label: 'คะแนนรีวิว' },
  { value: 'name', label: 'ชื่อ A–Z' },
];

const pill = (active: boolean) =>
  `shrink-0 rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-ink text-white' : 'bg-surface text-ink hover:bg-surface-2'}`;

function ProductsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Paged<Product> | null>(null);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const minPrice = params.get('minPrice') ?? '';
  const maxPrice = params.get('maxPrice') ?? '';
  const inStock = params.get('inStock') === 'true';
  const sort = params.get('sort') ?? 'newest';
  const page = Number(params.get('page') ?? 1);

  const [search, setSearch] = useState(q);
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  useEffect(() => setSearch(q), [q]);

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    setError('');
    api
      .get<Paged<Product>>('/products', { q, categoryId, minPrice, maxPrice, inStock: inStock || undefined, sort, page, pageSize: 12 })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [q, categoryId, minPrice, maxPrice, inStock, sort, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const activeCategory = categories.find((c) => String(c.id) === categoryId);
  const hasFilters = !!(q || minPrice || maxPrice || inStock);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="headline">
          {activeCategory ? activeCategory.name : 'ร้านค้า'}
          <span className="text-muted">{q ? ` · “${q}”` : activeCategory ? '' : ' อุปกรณ์เกมมิ่งทั้งหมด'}</span>
        </h1>
        <form
          className="relative w-full sm:w-72"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            update({ q: search.trim() || undefined });
          }}
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input className="input rounded-full pl-10" placeholder="ค้นหาสินค้า" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </div>

      <div className="scroller items-center pb-0">
        <button className={pill(!categoryId)} onClick={() => update({ categoryId: undefined })}>ทั้งหมด</button>
        {categories.map((c) => (
          <button key={c.id} className={pill(String(c.id) === categoryId)} onClick={() => update({ categoryId: String(c.id) })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-sm">
        <span className="text-muted">{data ? `${data.total} รายการ` : ' '}</span>
        <div className="flex flex-wrap items-center gap-3">
          {hasFilters && (
            <button className="link flex items-center gap-1" onClick={() => router.push(categoryId ? `${pathname}?categoryId=${categoryId}` : pathname)}>
              <X size={14} /> ล้างตัวกรอง
            </button>
          )}
          <button className="flex items-center gap-1.5 hover:text-accent" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={15} /> ตัวกรอง
          </button>
          <select
            aria-label="เรียงตาม"
            className="rounded-full bg-surface px-3 py-1.5 outline-none"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="card flex flex-wrap items-end gap-6 p-6">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              update({ minPrice: min || undefined, maxPrice: max || undefined });
            }}
          >
            <div>
              <label className="label" htmlFor="min">ราคาต่ำสุด</label>
              <input id="min" className="input w-36" type="number" min={0} placeholder="฿0" value={min} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="max">ราคาสูงสุด</label>
              <input id="max" className="input w-36" type="number" min={0} placeholder="ไม่จำกัด" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
            <button className="btn-secondary">ใช้ช่วงราคา</button>
          </form>
          <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={inStock}
              onChange={(e) => update({ inStock: e.target.checked ? 'true' : undefined })}
            />
            เฉพาะสินค้าที่พร้อมส่ง
          </label>
        </div>
      )}

      {error ? (
        <ErrorBox message={error} />
      ) : !data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <Empty title="ไม่พบสินค้าที่ตรงกับเงื่อนไข">
          <p className="text-muted">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
        </Empty>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`h-9 w-9 rounded-full text-sm ${n === page ? 'bg-ink text-white' : 'bg-surface hover:bg-surface-2'}`}
                  onClick={() => update({ page: String(n) })}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductsView />
    </Suspense>
  );
}
