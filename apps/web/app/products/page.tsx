'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Empty, ErrorBox, PageTitle, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { Category, Paged, Product } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'ใหม่ล่าสุด' },
  { value: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
  { value: 'rating', label: 'คะแนนรีวิว' },
  { value: 'name', label: 'ชื่อ A-Z' },
];

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

  return (
    <div>
      <PageTitle sub={activeCategory ? `หมวดหมู่: ${activeCategory.name}` : 'อุปกรณ์เกมมิ่งทั้งหมด'}>PRODUCTS</PageTitle>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          update({ q: search.trim() || undefined });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            className="input pl-10"
            placeholder="ค้นหาสินค้า เช่น Logitech, คีย์บอร์ด, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-primary">ค้นหา</button>
        <button type="button" className="btn-ghost lg:hidden" onClick={() => setShowFilters(!showFilters)} aria-label="ตัวกรอง">
          <SlidersHorizontal size={18} />
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${showFilters ? 'block' : 'hidden'} space-y-6 lg:block`}>
          <div className="card p-4">
            <h3 className="mb-3 font-medium">หมวดหมู่</h3>
            <div className="flex flex-col gap-1 text-sm">
              <button
                className={`rounded-md px-2 py-1.5 text-left ${!categoryId ? 'bg-neon-cyan/10 text-neon-cyan' : 'hover:bg-white/5'}`}
                onClick={() => update({ categoryId: undefined })}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`flex justify-between rounded-md px-2 py-1.5 text-left ${
                    String(c.id) === categoryId ? 'bg-neon-cyan/10 text-neon-cyan' : 'hover:bg-white/5'
                  }`}
                  onClick={() => update({ categoryId: String(c.id) })}
                >
                  {c.name} <span className="text-muted">{c.productCount}</span>
                </button>
              ))}
            </div>
          </div>

          <form
            className="card space-y-3 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              update({ minPrice: min || undefined, maxPrice: max || undefined });
            }}
          >
            <h3 className="font-medium">ช่วงราคา (บาท)</h3>
            <div className="flex items-center gap-2">
              <input className="input" type="number" min={0} placeholder="ต่ำสุด" value={min} onChange={(e) => setMin(e.target.value)} />
              <span className="text-muted">-</span>
              <input className="input" type="number" min={0} placeholder="สูงสุด" value={max} onChange={(e) => setMax(e.target.value)} />
            </div>
            <button className="btn-cyan w-full">ใช้ช่วงราคา</button>
          </form>

          <div className="card space-y-3 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#22e3ff]"
                checked={inStock}
                onChange={(e) => update({ inStock: e.target.checked ? 'true' : undefined })}
              />
              แสดงเฉพาะสินค้าที่มีในสต็อก
            </label>
            <div>
              <label className="label" htmlFor="sort">
                เรียงตาม
              </label>
              <select id="sort" className="input" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {(q || categoryId || minPrice || maxPrice || inStock) && (
              <button className="btn-ghost w-full" onClick={() => router.push(pathname)}>
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </aside>

        <section>
          {error ? (
            <ErrorBox message={error} />
          ) : !data ? (
            <Spinner />
          ) : data.items.length === 0 ? (
            <Empty title="ไม่พบสินค้าที่ตรงกับเงื่อนไข">
              <p className="text-sm text-muted">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </Empty>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">พบ {data.total} รายการ</p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {data.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      className={n === page ? 'btn-primary' : 'btn-ghost'}
                      onClick={() => update({ page: String(n) })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
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
