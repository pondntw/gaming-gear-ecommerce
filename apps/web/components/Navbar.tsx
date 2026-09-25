'use client';

import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, UserCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { Category } from '@/lib/types';

export function LogoMark({ className = 'h-5 w-5' }: { className?: string }) {
  // D-pad mark from the group's slides.
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M9 2h6v6.2L12 11 9 8.2zM2 9h6.2L11 12l-2.8 3H2zM22 9v6h-6.2L13 12l2.8-3zM9 22v-6.2L12 13l3 2.8V22z"
      />
    </svg>
  );
}

function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);
  return categories;
}

function NavInner() {
  const { user, logout, cartCount } = useStore();
  const categories = useCategories();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [panel, setPanel] = useState<'search' | 'account' | 'menu' | null>(null);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Close any open panel on navigation.
  useEffect(() => setPanel(null), [pathname, params]);
  useEffect(() => {
    if (panel === 'search') searchRef.current?.focus();
    document.body.style.overflow = panel === 'menu' ? 'hidden' : '';
  }, [panel]);

  const activeCat = pathname === '/products' ? params.get('categoryId') : null;
  const toggle = (p: typeof panel) => setPanel((cur) => (cur === p ? null : p));

  const search = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const doLogout = () => {
    logout();
    router.push('/');
  };

  const linkCls = (active: boolean) =>
    `text-[13px] transition ${active ? 'text-ink' : 'text-ink/75 hover:text-ink'}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
        <nav className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-ink" aria-label="หน้าแรก">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-tight">Gaming Gear</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-7 lg:flex">
            <Link href="/products" className={linkCls(pathname === '/products' && !activeCat)}>
              Store
            </Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/products?categoryId=${c.id}`} className={linkCls(activeCat === String(c.id))}>
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5 text-ink/80">
            <button onClick={() => toggle('search')} aria-label="ค้นหา" className="hover:text-ink">
              <Search size={17} />
            </button>
            <Link href="/cart" className="relative hover:text-ink" aria-label={`ถุงช้อปปิ้ง ${cartCount} ชิ้น`}>
              <ShoppingBag size={17} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => toggle('account')} aria-label="บัญชี" className="hidden hover:text-ink sm:block">
              <UserCircle2 size={18} />
            </button>
            <button onClick={() => toggle('menu')} aria-label="เมนู" className="hover:text-ink lg:hidden">
              {panel === 'menu' ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {panel === 'search' && (
          <div className="border-t border-black/5 bg-white/95">
            <form onSubmit={search} className="mx-auto flex max-w-[680px] items-center gap-3 px-6 py-6">
              <Search size={22} className="text-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาสินค้า เช่น Logitech, คีย์บอร์ด"
                className="flex-1 bg-transparent text-2xl font-medium tracking-tight outline-none placeholder:text-[#86868b]"
              />
              <button type="button" onClick={() => setPanel(null)} aria-label="ปิด" className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </form>
          </div>
        )}

        {panel === 'account' && (
          <div className="border-t border-black/5 bg-white/95">
            <div className="mx-auto max-w-[1200px] px-6 py-6">
              {user ? (
                <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-sm">
                  <p className="text-muted">
                    สวัสดี, <span className="font-medium text-ink">{user.fullName}</span>
                  </p>
                  <Link href="/orders" className="flex items-center gap-2 hover:text-accent"><Package size={16} /> คำสั่งซื้อ</Link>
                  <Link href="/account" className="flex items-center gap-2 hover:text-accent"><User size={16} /> บัญชีของฉัน</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="flex items-center gap-2 hover:text-accent"><LayoutDashboard size={16} /> หลังร้าน</Link>
                  )}
                  <button onClick={doLogout} className="flex items-center gap-2 text-muted hover:text-ink"><LogOut size={16} /> ออกจากระบบ</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <p className="text-muted">เข้าสู่ระบบเพื่อดูคำสั่งซื้อและชำระเงินได้เร็วขึ้น</p>
                  <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary py-1.5">เข้าสู่ระบบ</Link>
                  <Link href="/register" className="link">สร้างบัญชี ›</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {panel === 'menu' && (
        <div className="fixed inset-0 top-12 z-30 overflow-y-auto bg-white px-8 py-6 lg:hidden">
          <div className="flex flex-col gap-4 text-2xl font-semibold tracking-tight">
            <Link href="/products">Store</Link>
            {categories.map((c) => (
              <Link key={c.id} href={`/products?categoryId=${c.id}`}>{c.name}</Link>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-base text-muted">
            {user ? (
              <>
                <Link href="/orders">คำสั่งซื้อ</Link>
                <Link href="/account">บัญชีของฉัน</Link>
                {user.role === 'admin' && <Link href="/admin">หลังร้าน</Link>}
                <button onClick={doLogout} className="text-left">ออกจากระบบ</button>
              </>
            ) : (
              <>
                <Link href="/login">เข้าสู่ระบบ</Link>
                <Link href="/register">สร้างบัญชี</Link>
              </>
            )}
          </div>
        </div>
      )}
      {(panel === 'search' || panel === 'account') && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={() => setPanel(null)} aria-hidden />
      )}
    </>
  );
}

export function Navbar() {
  // useSearchParams needs a Suspense boundary for statically rendered pages.
  return (
    <Suspense fallback={<header className="sticky top-0 z-40 h-12 border-b border-black/5 bg-white/80" />}>
      <NavInner />
    </Suspense>
  );
}

const FOOTER = [
  { title: 'เลือกซื้อ', links: [['สินค้าทั้งหมด', '/products'], ['ถุงช้อปปิ้ง', '/cart']] },
  { title: 'บัญชี', links: [['บัญชีของฉัน', '/account'], ['คำสั่งซื้อ', '/orders'], ['เข้าสู่ระบบ', '/login']] },
  { title: 'เกี่ยวกับ', links: [['CSC481 · ดุ๋มดึ๋ย GROUP', '/'], ['Next.js · NestJS · Supabase', '/']] },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-white text-xs text-muted">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <p className="border-b border-line pb-4">
          ส่งฟรีเมื่อซื้อครบ ฿3,000 · ชำระเงินผ่านโอนธนาคารหรือพร้อมเพย์ · รีวิวได้เฉพาะผู้ที่ซื้อสินค้าแล้ว
        </p>
        <div className="grid grid-cols-2 gap-8 py-6 sm:grid-cols-3">
          {FOOTER.map((col) => (
            <div key={col.title}>
              <p className="mb-2 font-semibold text-ink">{col.title}</p>
              <ul className="space-y-1.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:underline">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-line pt-4">© {new Date().getFullYear()} Gaming Gear Store. สงวนลิขสิทธิ์.</p>
      </div>
    </footer>
  );
}
