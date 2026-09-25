'use client';

import { LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/lib/store';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* D-pad mark from the group's slides */}
      <svg viewBox="0 0 24 24" className="h-8 w-8 drop-shadow-[0_0_8px_rgb(255_43_214/0.7)]" aria-hidden>
        <path
          fill="white"
          d="M9 2h6v6.2L12 11 9 8.2zM2 9h6.2L11 12l-2.8 3H2zM22 9v6h-6.2L13 12l2.8-3zM9 22v-6.2L12 13l3 2.8V22z"
        />
      </svg>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold tracking-widest text-white">GAMING GEAR</span>
        <span className="block text-[11px] text-muted">by ดุ๋มดึ๋ย GROUP</span>
      </span>
    </Link>
  );
}

const LINKS = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/products', label: 'สินค้าทั้งหมด' },
];

export function Navbar() {
  const { user, logout, cartCount } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const doLogout = () => {
    logout();
    setOpen(false);
    router.push('/');
  };

  const userLinks = user && (
    <>
      <Link href="/orders" className="flex items-center gap-1.5 hover:text-neon-cyan" onClick={() => setOpen(false)}>
        <Package size={16} /> คำสั่งซื้อ
      </Link>
      <Link href="/account" className="flex items-center gap-1.5 hover:text-neon-cyan" onClick={() => setOpen(false)}>
        <User size={16} /> {user.fullName.split(' ')[0]}
      </Link>
      {user.role === 'admin' && (
        <Link href="/admin" className="flex items-center gap-1.5 text-neon-pink hover:brightness-125" onClick={() => setOpen(false)}>
          <LayoutDashboard size={16} /> หลังร้าน
        </Link>
      )}
      <button onClick={doLogout} className="flex items-center gap-1.5 text-muted hover:text-white">
        <LogOut size={16} /> ออกจากระบบ
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Logo />
        <div className="hidden gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? 'text-neon-cyan' : 'text-slate-300 hover:text-white'}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-5 text-sm">
          <div className="hidden items-center gap-5 md:flex">
            {user ? (
              userLinks
            ) : (
              <>
                <Link href="/login" className="hover:text-neon-cyan">เข้าสู่ระบบ</Link>
                <Link href="/register" className="btn-primary">สมัครสมาชิก</Link>
              </>
            )}
          </div>
          <Link href="/cart" className="relative" aria-label="ตะกร้าสินค้า">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-pink px-1 text-[11px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="เมนู">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="flex flex-col gap-4 border-t border-line px-4 py-4 text-sm md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            userLinks
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>เข้าสู่ระบบ</Link>
              <Link href="/register" onClick={() => setOpen(false)}>สมัครสมาชิก</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Gaming Gear E-Commerce · CSC481 ดุ๋มดึ๋ย GROUP</span>
        <span>Next.js · NestJS · Supabase</span>
      </div>
    </footer>
  );
}
