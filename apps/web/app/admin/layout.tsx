'use client';

import { FolderTree, LayoutDashboard, MessageSquare, Package, ShoppingBag, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireAuth } from '@/components/ui';

const NAV = [
  { href: '/admin', label: 'ภาพรวม', icon: LayoutDashboard, color: 'bg-[#8e8e93]' },
  { href: '/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingBag, color: 'bg-[#0071e3]' },
  { href: '/admin/products', label: 'สินค้าและสต็อก', icon: Package, color: 'bg-[#ff9f0a]' },
  { href: '/admin/categories', label: 'หมวดหมู่', icon: FolderTree, color: 'bg-[#34c759]' },
  { href: '/admin/users', label: 'ผู้ใช้งาน', icon: Users, color: 'bg-[#5856d6]' },
  { href: '/admin/reviews', label: 'รีวิว', icon: MessageSquare, color: 'bg-[#ff375f]' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <RequireAuth role="admin">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="h-fit lg:sticky lg:top-20">
          <p className="px-3 pb-3 text-xs font-medium text-muted">หลังร้าน</p>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active(href) ? 'bg-accent text-white' : 'text-ink hover:bg-white'
                }`}
              >
                {/* Coloured rounded-square icons, like macOS System Settings. */}
                <span className={`flex h-6 w-6 items-center justify-center rounded-md text-white ${color}`}>
                  <Icon size={14} />
                </span>
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
