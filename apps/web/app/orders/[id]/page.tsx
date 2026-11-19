'use client';

import { Upload } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { OrderItemsTable, OrderTimeline, PaymentHistory, ShippingInfo } from '@/components/OrderParts';
import { ReviewForm } from '@/components/ReviewForm';
import { ErrorBox, RequireAuth, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Order, OrderOptions, Review } from '@/lib/types';

// Demo receiving account shown to customers; replace with the shop's real details.
const BANK_INFO = { bank: 'ธนาคารกสิกรไทย (บัญชีตัวอย่าง)', number: '123-4-56789-0', name: 'ดุ๋มดึ๋ย GROUP', promptpay: '081-234-5678' };

function PaymentForm({ order, onDone }: { order: Order; onDone: (o: Order) => void }) {
  const { toast } = useStore();
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [method, setMethod] = useState('bank_transfer');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<OrderOptions>('/orders/options').then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast('กรุณาแนบสลิปการโอนเงิน', 'error');
    const fd = new FormData();
    fd.append('paymentMethod', method);
    fd.append('slip', file);
    setBusy(true);
    try {
      onDone(await api.post<Order>(`/orders/${order.id}/payment`, fd));
      toast('ส่งหลักฐานการชำระเงินแล้ว รอเจ้าหน้าที่ตรวจสอบ');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 border-accent/50 p-5">
      <h2 className="font-medium">ชำระเงิน {formatPrice(order.total)}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(options?.paymentMethods ?? { bank_transfer: 'โอนผ่านบัญชีธนาคาร' }).map(([key, label]) => (
          <label
            key={key}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
              method === key ? 'border-accent bg-accent/5' : 'border-line'
            }`}
          >
            <input type="radio" name="method" className="accent-accent" checked={method === key} onChange={() => setMethod(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="rounded-xl bg-surface p-4 text-sm">
        {method === 'promptpay' ? (
          <p>พร้อมเพย์: <span className="font-mono text-accent">{BANK_INFO.promptpay}</span> ({BANK_INFO.name})</p>
        ) : (
          <>
            <p>{BANK_INFO.bank}</p>
            <p>เลขบัญชี: <span className="font-mono text-accent">{BANK_INFO.number}</span></p>
            <p>ชื่อบัญชี: {BANK_INFO.name}</p>
          </>
        )}
      </div>
      <div>
        <label className="label" htmlFor="slip">แนบสลิปการโอนเงิน (JPG, PNG, WEBP ไม่เกิน 5MB)</label>
        <label
          htmlFor="slip"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line p-6 text-sm text-muted hover:border-accent"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="ตัวอย่างสลิป" className="max-h-64 rounded" />
          ) : (
            <>
              <Upload size={24} /> คลิกเพื่อเลือกไฟล์
            </>
          )}
        </label>
        <input
          id="slip"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <button className="btn-primary w-full py-2.5" disabled={busy || !file}>
        {busy ? 'กำลังอัปโหลด...' : 'แจ้งชำระเงิน'}
      </button>
    </form>
  );
}

function DeliveredReviews({ order }: { order: Order }) {
  const [mine, setMine] = useState<Record<number, Review | null>>({});
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all(
      order.items.map((i) =>
        api
          .get<{ review: Review | null }>(`/products/${i.productId}/reviews/mine`)
          .then((r) => [i.productId, r.review] as const),
      ),
    )
      .then((rows) => setMine(Object.fromEntries(rows)))
      .catch(() => {});
  }, [order]);

  return (
    <section className="card p-5">
      <h2 className="mb-4 font-medium">รีวิวสินค้าที่ได้รับ</h2>
      <div className="space-y-3">
        {order.items.map((i) => (
          <div key={i.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/products/${i.productId}`} className="hover:text-accent">{i.product.name}</Link>
              <button className="btn-secondary py-1" onClick={() => setOpenId(openId === i.productId ? null : i.productId)}>
                {mine[i.productId] ? 'แก้ไขรีวิว' : 'เขียนรีวิว'}
              </button>
            </div>
            {openId === i.productId && (
              <ReviewForm
                productId={i.productId}
                existing={mine[i.productId] ?? null}
                onSaved={(r) => {
                  setMine({ ...mine, [i.productId]: r });
                  setOpenId(null);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(() => {
    api.get<Order>(`/orders/${id}`).then(setOrder).catch((e) => setError(errorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <ErrorBox message={error} />;
  if (!order) return <Spinner />;

  const cancel = async () => {
    if (!confirm('ยืนยันการยกเลิกคำสั่งซื้อนี้?')) return;
    setCancelling(true);
    try {
      setOrder(await api.post<Order>(`/orders/${order.id}/cancel`));
      toast('ยกเลิกคำสั่งซื้อแล้ว');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order.status === 'pending_payment' || order.status === 'payment_review';
  const rejected = order.status === 'pending_payment' && order.payments[0]?.status === 'rejected';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/orders" className="text-sm text-muted hover:text-ink">← คำสั่งซื้อทั้งหมด</Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="section-title">คำสั่งซื้อ #{order.id}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.orderDate)}</span>
        {canCancel && (
          <button className="btn-danger ml-auto" disabled={cancelling} onClick={cancel}>
            ยกเลิกคำสั่งซื้อ
          </button>
        )}
      </div>

      <div className="card p-5">
        <OrderTimeline status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {order.status === 'pending_payment' && (
            <>
              {rejected && <ErrorBox message="สลิปก่อนหน้าไม่ผ่านการตรวจสอบ กรุณาแนบหลักฐานการชำระเงินใหม่" />}
              <PaymentForm order={order} onDone={setOrder} />
            </>
          )}
          {order.status === 'payment_review' && (
            <div className="rounded-lg border border-transparent bg-[#f3eefe] p-4 text-sm text-[#6e3ad6]">
              ได้รับหลักฐานการชำระเงินแล้ว กำลังรอเจ้าหน้าที่ตรวจสอบ
            </div>
          )}
          {order.status === 'delivered' && <DeliveredReviews order={order} />}
          <section className="card p-5">
            <h2 className="mb-4 font-medium">รายการสินค้า</h2>
            <OrderItemsTable order={order} />
          </section>
        </div>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-medium">ที่อยู่จัดส่ง</h2>
            <ShippingInfo order={order} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-medium">การชำระเงิน</h2>
            <PaymentHistory order={order} />
          </section>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireAuth>
      <OrderDetail />
    </RequireAuth>
  );
}
