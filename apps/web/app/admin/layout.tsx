'use client';

import { FolderTree, LayoutDashboard, MessageSquare, Package, ShoppingBag, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/ui';

const NAV = [
  { href: '/admin', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingBag },
  { href: '/admin/products', label: 'สินค้าและสต็อก', icon: Package },
  { href: '/admin/categories', label: 'หมวดหมู่', icon: FolderTree },
  { href: '/admin/users', label: 'ผู้ใช้งาน', icon: Users },
  { href: '/admin/reviews', label: 'รีวิว', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <RequireAuth role="admin">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="card h-fit p-3 lg:sticky lg:top-24">
          <p className="px-3 pb-2 pt-1 text-xs tracking-widest text-neon-pink">ADMIN PANEL</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active(href) ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon size={17} /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
