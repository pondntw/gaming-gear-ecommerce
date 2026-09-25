'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUS } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';

function AdminOrdersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = params.get('status') ?? '';
  const q = params.get('q') ?? '';
  const [search, setSearch] = useState(q);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setOrders(null);
    api.get<Order[]>('/admin/orders', { status, q }).then(setOrders).catch((e) => setError(errorMessage(e)));
  }, [status, q]);

  const go = (next: { status?: string; q?: string }) => {
    const p = new URLSearchParams({ status, q, ...next });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    router.push(`${pathname}?${p.toString()}`);
  };

  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <PageTitle sub="ตรวจสลิป อัปเดตสถานะ และเลขพัสดุ">ORDERS</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={!status ? 'btn-cyan py-1.5' : 'btn-ghost py-1.5'} onClick={() => go({ status: '' })}>ทั้งหมด</button>
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
          <button key={s} className={status === s ? 'btn-cyan py-1.5' : 'btn-ghost py-1.5'} onClick={() => go({ status: s })}>
            {ORDER_STATUS[s].label}
          </button>
        ))}
      </div>
      <form
        className="relative mb-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: search.trim() });
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input className="input pl-9" placeholder="เลขคำสั่งซื้อ / ชื่อผู้รับ / อีเมล / เลขพัสดุ" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      {!orders ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>วันที่</th>
                <th>ลูกค้า</th>
                <th>สินค้า</th>
                <th className="text-right">ยอดรวม</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-white/5" onClick={() => router.push(`/admin/orders/${o.id}`)}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-display text-neon-cyan">#{o.id}</Link>
                  </td>
                  <td className="whitespace-nowrap text-muted">{formatDate(o.orderDate)}</td>
                  <td>
                    <p>{o.user.fullName}</p>
                    <p className="text-xs text-muted">{o.user.email}</p>
                  </td>
                  <td className="text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} ชิ้น</td>
                  <td className="text-right font-medium">{formatPrice(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted">ไม่พบคำสั่งซื้อ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminOrdersView />
    </Suspense>
  );
}
