'use client';

import { BadgeCheck, CreditCard, PackageSearch, Truck } from 'lucide-react';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { ErrorBox, ProductImage, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Category, Paged, Product } from '@/lib/types';

const PERKS = [
  { icon: Truck, title: 'ส่งฟรี', text: 'เมื่อซื้อครบ ฿3,000 จัดส่งแบบธรรมดา 3–5 วัน' },
  { icon: PackageSearch, title: 'ติดตามได้ทุกขั้นตอน', text: 'ดูสถานะและเลขพัสดุได้จากหน้าคำสั่งซื้อ' },
  { icon: CreditCard, title: 'ชำระเงินง่าย', text: 'โอนผ่านธนาคารหรือพร้อมเพย์ แล้วแนบสลิป' },
  { icon: BadgeCheck, title: 'รีวิวจากผู้ซื้อจริง', text: 'รีวิวได้เฉพาะลูกค้าที่ได้รับสินค้าแล้ว' },
];

/** Section heading in the Apple Store style: bold lead phrase followed by a grey continuation. */
function Shelf({ lead, rest, link, children }: { lead: string; rest?: string; link?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="section-title">
          {lead}
          {rest && <span className="text-muted"> {rest}</span>}
        </h2>
        {link}
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const { user } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [covers, setCovers] = useState<Record<number, Product>>({});
  const [latest, setLatest] = useState<Product[] | null>(null);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Paged<Product>>('/products', { sort: 'newest', pageSize: 100 }),
      api.get<Paged<Product>>('/products', { sort: 'rating', pageSize: 8 }),
    ])
      .then(([c, all, t]) => {
        setCategories(c);
        // One representative product per category for the category strip.
        const firstByCategory: Record<number, Product> = {};
        for (const p of all.items) if (p.categoryId && p.imageUrl) firstByCategory[p.categoryId] = p;
        setCovers(firstByCategory);
        setLatest(all.items.slice(0, 8));
        setTopRated(t.items.filter((p) => p.rating.count > 0));
      })
      .catch((e) => {
        setError(errorMessage(e));
        setLatest([]);
      });
  }, []);

  const featured = latest?.[0];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="flex flex-wrap items-end justify-between gap-6 pt-2">
        <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-[64px]">
          Store. <span className="text-muted">วิธีที่ดีที่สุดในการซื้อเกียร์ที่คุณรัก</span>
        </h1>
        <div className="text-sm text-muted">
          {user ? (
            <p>
              สวัสดี {user.fullName.split(' ')[0]} ·{' '}
              <Link href="/orders" className="link">ดูคำสั่งซื้อ ›</Link>
            </p>
          ) : (
            <p>
              ยังไม่มีบัญชี?{' '}
              <Link href="/register" className="link">สร้างบัญชีฟรี ›</Link>
            </p>
          )}
        </div>
      </section>

      {/* Category strip */}
      {categories.length > 0 && (
        <nav className="scroller -mx-4 px-4 sm:-mx-6 sm:px-6" aria-label="หมวดหมู่สินค้า">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?categoryId=${c.id}`}
              className="group flex w-28 shrink-0 snap-start flex-col items-center gap-3 text-center"
            >
              <div className="card-hover h-24 w-24 overflow-hidden rounded-3xl">
                <ProductImage src={covers[c.id]?.imageUrl ?? null} category={c.name} alt="" />
              </div>
              <span className="text-sm font-medium">{c.name}</span>
            </Link>
          ))}
        </nav>
      )}

      {error && <ErrorBox message={error} />}

      {/* Featured */}
      {featured && (
        <Link href={`/products/${featured.id}`} className="card-hover group grid overflow-hidden md:grid-cols-2">
          <div className="flex flex-col justify-center gap-3 p-8 sm:p-12">
            <span className="text-sm font-medium text-warn">มาใหม่</span>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{featured.name}</h2>
            <p className="text-muted">{featured.description}</p>
            <p className="text-lg">{formatPrice(featured.price)}</p>
            <span className="btn-primary mt-2 w-fit">ซื้อเลย</span>
          </div>
          <div className="aspect-square overflow-hidden">
            <ProductImage
              src={featured.imageUrl}
              category={featured.category?.name}
              alt={featured.name}
              className="transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </Link>
      )}

      <Shelf
        lead="ล่าสุด."
        rest="สินค้ามาใหม่ที่คุณต้องไม่พลาด"
        link={<Link href="/products" className="link shrink-0 text-sm">ดูทั้งหมด ›</Link>}
      >
        {latest === null ? (
          <Spinner />
        ) : (
          <div className="scroller -mx-4 px-4 sm:-mx-6 sm:px-6">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} className="w-[260px] shrink-0 snap-start sm:w-[280px]" />
            ))}
          </div>
        )}
      </Shelf>

      <Shelf lead="ทำไมต้องซื้อกับเรา." rest="ช้อปง่าย มั่นใจทุกขั้นตอน">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <Icon className="text-accent" size={28} strokeWidth={1.6} />
              <p className="mt-4 text-lg font-semibold tracking-tight">{title}</p>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </Shelf>

      {topRated.length > 0 && (
        <Shelf lead="คะแนนรีวิวสูงสุด." rest="ลูกค้าเลือกแล้วว่าดี">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topRated.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Shelf>
      )}
    </div>
  );
}
