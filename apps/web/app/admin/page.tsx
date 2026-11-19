'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice, STATUS_FLOW } from '@/lib/format';
import type { AdminStats } from '@/lib/types';

const PERIOD_OPTIONS = [
  { value: '1d', label: '1 วัน', desc: 'ข้อมูลย้อนหลัง 1 วัน (24 ชั่วโมงที่ผ่านมา)' },
  { value: '7d', label: '7 วัน', desc: 'ข้อมูลย้อนหลัง 7 วันที่ผ่านมา' },
  { value: '14d', label: '14 วัน', desc: 'ข้อมูลย้อนหลัง 14 วันที่ผ่านมา' },
  { value: '30d', label: '1 เดือน', desc: 'ข้อมูลย้อนหลัง 1 เดือน (30 วันที่ผ่านมา)' },
  { value: 'all', label: 'ทั้งหมด', desc: 'ข้อมูลภาพรวมทั้งหมดตั้งแต่เปิดร้าน' },
] as const;

type Period = (typeof PERIOD_OPTIONS)[number]['value'];

function AdminDashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryPeriod = (searchParams.get('period') as Period) || 'all';
  const [period, setPeriod] = useState<Period>(queryPeriod);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state if URL query param changes externally
  useEffect(() => {
    const p = (searchParams.get('period') as Period) || 'all';
    setPeriod(p);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    api.get<AdminStats>('/admin/stats', { period })
      .then((data) => {
        setStats(data);
        setError('');
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [period]);

  const handlePeriodChange = (next: Period) => {
    setPeriod(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'all') {
      params.delete('period');
    } else {
      params.set('period', next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <Spinner />;

  const activeOption = PERIOD_OPTIONS.find((p) => p.value === period) ?? PERIODS_FALLBACK;
  const totalOrders = Object.values(stats.ordersByStatus).reduce((a, b) => a + (b ?? 0), 0);
  const todo = stats.todoCount ?? ((stats.ordersByStatus.payment_review ?? 0) + (stats.ordersByStatus.processing ?? 0));

  const tiles = [
    {
      label: 'ยอดขาย (ชำระแล้ว)',
      value: formatPrice(stats.revenue),
      accent: 'text-ink',
      hint: period === 'all' ? 'ยอดขายสะสมทั้งหมด' : `ยอดขายในรอบ ${activeOption.label}`,
    },
    {
      label: period === 'all' ? 'คำสั่งซื้อทั้งหมด' : 'คำสั่งซื้อ',
      value: totalOrders.toLocaleString(),
      hint: period === 'all' ? 'รวมทุกสถานะ' : `ในรอบ ${activeOption.label}`,
    },
    {
      label: period === 'all' ? 'ลูกค้าทั้งหมด' : 'ลูกค้าใหม่',
      value: stats.customers.toLocaleString(),
      hint:
        period === 'all'
          ? 'ผู้ใช้ทั่วไปที่ลงทะเบียน'
          : `สมัครใหม่ในรอบ ${activeOption.label}${stats.totalCustomers ? ` (จาก ${stats.totalCustomers.toLocaleString()} คน)` : ''}`,
    },
    {
      label: 'สินค้าที่วางขาย',
      value: stats.products.toLocaleString(),
      hint: 'สินค้าที่เปิดขายอยู่ปัจจุบัน',
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        sub={
          <span className="flex items-center gap-1.5">
            <Clock size={16} className="text-muted" />
            {activeOption.desc}
          </span>
        }
        action={
          <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl bg-surface p-1">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePeriodChange(opt.value)}
                  className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
                    active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        }
      >
        ภาพรวม
      </PageTitle>

      <div className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="card p-5">
              <p className="text-sm text-muted">{t.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${t.accent ?? ''}`}>{t.value}</p>
              {t.hint && <p className="mt-1 text-xs text-muted/80">{t.hint}</p>}
            </div>
          ))}
        </div>

        {todo > 0 && (
          <Link
            href="/admin/orders?status=payment_review"
            className="card-hover flex items-center gap-3 border-transparent p-4"
          >
            <AlertTriangle className="text-[#6e3ad6]" />
            <span>
              มีคำสั่งซื้อที่ต้องดำเนินการ <strong className="font-semibold text-ink">{todo}</strong> รายการ (ตรวจสลิป / เตรียมจัดส่ง)
            </span>
          </Link>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">คำสั่งซื้อตามสถานะ</h2>
              <span className="text-xs text-muted">รอบ {activeOption.label}</span>
            </div>
            <ul className="space-y-2">
              {[...STATUS_FLOW, 'cancelled' as const].map((s) => (
                <li key={s}>
                  <Link
                    href={`/admin/orders?status=${s}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface"
                  >
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
                    <span className={p.stockQuantity === 0 ? 'text-danger' : 'text-warn'}>
                      {p.stockQuantity} ชิ้น
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/products" className="mt-4 inline-block text-sm text-accent hover:underline">
              จัดการสต็อก →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

const PERIODS_FALLBACK = PERIOD_OPTIONS[4];

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminDashboardView />
    </Suspense>
  );
}
