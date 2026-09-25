'use client';

import { ArrowRight, BadgeCheck, PackageSearch, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { categoryIcon, ErrorBox, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { Category, Paged, Product } from '@/lib/types';

const PERKS = [
  { icon: PackageSearch, title: 'ค้นหาง่าย', text: 'กรองตามหมวด ราคา และสต็อก' },
  { icon: Truck, title: 'ติดตามพัสดุ', text: 'เช็กสถานะคำสั่งซื้อได้ตลอด' },
  { icon: ShieldCheck, title: 'ชำระเงินปลอดภัย', text: 'โอน/พร้อมเพย์ พร้อมแนบสลิป' },
  { icon: BadgeCheck, title: 'รีวิวจริง', text: 'รีวิวได้เฉพาะผู้ที่ซื้อแล้ว' },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [latest, setLatest] = useState<Product[] | null>(null);
  const [topRated, setTopRated] = useState<Product[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<Paged<Product>>('/products', { sort: 'newest', pageSize: 8 }),
      api.get<Paged<Product>>('/products', { sort: 'rating', pageSize: 4 }),
    ])
      .then(([c, l, t]) => {
        setCategories(c);
        setLatest(l.items);
        setTopRated(t.items.filter((p) => p.rating.count > 0));
      })
      .catch((e) => {
        setError(errorMessage(e));
        setLatest([]);
      });
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line px-6 py-16 sm:px-12 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(600px_300px_at_80%_20%,rgb(34_227_255/0.18),transparent),radial-gradient(500px_300px_at_10%_90%,rgb(255_43_214/0.22),transparent)]" />
        <p className="mb-4 text-sm tracking-[0.3em] text-neon-cyan">CSC481 · ดุ๋มดึ๋ย GROUP</p>
        <h1 className="neon-title text-4xl leading-tight sm:text-6xl">
          GAMING GEAR
          <br />
          E-COMMERCE
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">
          ร้านจำหน่ายอุปกรณ์เกมมิ่งครบในที่เดียว — เมาส์ คีย์บอร์ด หูฟัง จอ เก้าอี้ และจอยเกม
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary px-6 py-3 text-base">
            เลือกซื้อสินค้า <ArrowRight size={18} />
          </Link>
          <Link href="/register" className="btn-cyan px-6 py-3 text-base">
            สมัครสมาชิก
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex items-start gap-3 p-4">
            <Icon className="mt-0.5 shrink-0 text-neon-pink" size={22} />
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {error && <ErrorBox message={error} />}

      {categories.length > 0 && (
        <section>
          <h2 className="neon-title mb-5 text-xl">CATEGORIES</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => {
              const Icon = categoryIcon(c.name);
              return (
                <Link
                  key={c.id}
                  href={`/products?categoryId=${c.id}`}
                  className="card-glow flex flex-col items-center gap-2 px-3 py-6 text-center"
                >
                  <Icon size={34} className="text-neon-cyan" strokeWidth={1.4} />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted">{c.productCount} รายการ</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {topRated.length > 0 && (
        <section>
          <h2 className="neon-title mb-5 text-xl">TOP RATED</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {topRated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="neon-title text-xl">NEW ARRIVALS</h2>
          <Link href="/products" className="text-sm text-neon-cyan hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        {latest === null ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
