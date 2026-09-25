'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice, STATUS_FLOW } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

type Stats = {
  customers: number;
  products: number;
  reviews: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  revenue: number;
  lowStock: { id: number; name: string; sku: string; stockQuantity: number }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Stats>('/admin/stats').then(setStats).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <Spinner />;

  const totalOrders = Object.values(stats.ordersByStatus).reduce((a, b) => a + (b ?? 0), 0);
  const tiles = [
    { label: 'ยอดขาย (ชำระแล้ว)', value: formatPrice(stats.revenue), accent: 'text-ink' },
    { label: 'คำสั่งซื้อทั้งหมด', value: totalOrders.toLocaleString() },
    { label: 'ลูกค้า', value: stats.customers.toLocaleString() },
    { label: 'สินค้าที่วางขาย', value: stats.products.toLocaleString() },
  ];
  const todo = (stats.ordersByStatus.payment_review ?? 0) + (stats.ordersByStatus.processing ?? 0);

  return (
    <div className="space-y-6">
      <PageTitle>ภาพรวม</PageTitle>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <p className="text-sm text-muted">{t.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${t.accent ?? ''}`}>{t.value}</p>
          </div>
        ))}
      </div>

      {todo > 0 && (
        <Link href="/admin/orders?status=payment_review" className="card-hover flex items-center gap-3 border-transparent p-4">
          <AlertTriangle className="text-[#6e3ad6]" />
          มีคำสั่งซื้อที่ต้องดำเนินการ {todo} รายการ (ตรวจสลิป / เตรียมจัดส่ง)
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-medium">คำสั่งซื้อตามสถานะ</h2>
          <ul className="space-y-2">
            {[...STATUS_FLOW, 'cancelled' as const].map((s) => (
              <li key={s}>
                <Link href={`/admin/orders?status=${s}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface">
                  <StatusBadge status={s} />
                  <span className="font-medium">{stats.ordersByStatus[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-medium">สินค้าใกล้หมด (น้อยกว่า 5 ชิ้น)</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted">สต็อกเพียงพอทุกรายการ</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    <span className="text-muted">{p.sku}</span> {p.name}
                  </span>
                  <span className={p.stockQuantity === 0 ? 'text-danger' : 'text-warn'}>{p.stockQuantity} ชิ้น</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/products" className="mt-4 inline-block text-sm text-accent hover:underline">จัดการสต็อก →</Link>
        </section>
      </div>
    </div>
  );
}
