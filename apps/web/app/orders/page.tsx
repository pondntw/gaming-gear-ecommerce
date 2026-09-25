'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Empty, ErrorBox, PageTitle, RequireAuth, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';
import type { Order } from '@/lib/types';

function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Order[]>('/orders').then(setOrders).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!orders) return <Spinner />;

  return (
    <>
      <PageTitle sub="ประวัติและสถานะคำสั่งซื้อของคุณ">MY ORDERS</PageTitle>
      {orders.length === 0 ? (
        <Empty icon={Package} title="ยังไม่มีคำสั่งซื้อ">
          <Link href="/products" className="btn-primary">เริ่มช้อปเลย</Link>
        </Empty>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card-glow flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <span className="font-display text-neon-cyan">#{o.id}</span>
              <span className="text-sm text-muted">{formatDate(o.orderDate)}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {o.items.map((i) => i.product.name).join(', ')}
              </span>
              <StatusBadge status={o.status} />
              <span className="font-semibold text-neon-pink">{formatPrice(o.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersView />
    </RequireAuth>
  );
}
