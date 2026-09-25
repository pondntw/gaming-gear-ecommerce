'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { OrderItemsTable, OrderTimeline, PaymentHistory, ShippingInfo } from '@/components/OrderParts';
import { ErrorBox, PaymentBadge, Spinner, StatusBadge } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUS } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Order, OrderStatus } from '@/lib/types';

// Mirrors ADMIN_TRANSITIONS in apps/api/src/orders/order-rules.ts
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  payment_review: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState('');
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [busy, setBusy] = useState(false);

  const apply = (o: Order) => {
    setOrder(o);
    setTracking(o.trackingNumber ?? '');
    setNextStatus('');
  };

  useEffect(() => {
    api.get<Order>(`/admin/orders/${id}`).then(apply).catch((e) => setError(errorMessage(e)));
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!order) return <Spinner />;

  const act = async (fn: () => Promise<Order>, msg: string) => {
    setBusy(true);
    try {
      apply(await fn());
      toast(msg);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (nextStatus === 'cancelled' && !confirm('ยืนยันยกเลิกคำสั่งซื้อนี้? สินค้าจะถูกคืนเข้าสต็อก')) return;
    act(
      () =>
        api.patch<Order>(`/admin/orders/${order.id}`, {
          status: nextStatus || undefined,
          trackingNumber: tracking,
        }),
      'อัปเดตคำสั่งซื้อแล้ว',
    );
  };

  const pendingPayment = order.payments.find((p) => p.status === 'pending');
  const options = NEXT_STATUS[order.status];

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm text-muted hover:text-white">← คำสั่งซื้อทั้งหมด</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="neon-title text-2xl">ORDER #{order.id}</h1>
        <StatusBadge status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.orderDate)}</span>
      </div>

      <div className="card p-5">
        <OrderTimeline status={order.status} />
      </div>

      {pendingPayment && order.status === 'payment_review' && (
        <section className="card space-y-4 border-violet-400/60 p-5">
          <h2 className="flex items-center gap-2 font-medium">
            ตรวจสอบการชำระเงิน <PaymentBadge status="pending" />
          </h2>
          <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
            {pendingPayment.proofUrl ? (
              <a href={pendingPayment.proofUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingPayment.proofUrl} alt="สลิปการโอนเงิน" className="max-h-80 w-full object-contain" />
              </a>
            ) : (
              <p className="text-sm text-muted">ไม่สามารถโหลดรูปสลิปได้</p>
            )}
            <div className="space-y-2 text-sm">
              <p>ยอดที่ต้องชำระ: <span className="font-semibold text-neon-pink">{formatPrice(order.total)}</span></p>
              <p>ยอดที่แจ้ง: {formatPrice(pendingPayment.amount)}</p>
              <p>วิธีชำระ: {pendingPayment.paymentMethod === 'promptpay' ? 'พร้อมเพย์' : 'โอนผ่านธนาคาร'}</p>
              <p className="text-muted">แจ้งเมื่อ {formatDate(pendingPayment.paidAt)}</p>
              <div className="flex gap-2 pt-2">
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => act(() => api.post(`/admin/payments/${pendingPayment.id}/approve`), 'อนุมัติการชำระเงินแล้ว')}
                >
                  <CheckCircle2 size={16} /> อนุมัติ
                </button>
                <button
                  className="btn-danger"
                  disabled={busy}
                  onClick={() =>
                    confirm('ปฏิเสธสลิปนี้? ลูกค้าจะต้องแนบสลิปใหม่') &&
                    act(() => api.post(`/admin/payments/${pendingPayment.id}/reject`), 'ปฏิเสธสลิปแล้ว')
                  }
                >
                  <XCircle size={16} /> ปฏิเสธ
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-medium">รายการสินค้า</h2>
            <OrderItemsTable order={order} />
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-medium">ประวัติการชำระเงิน</h2>
            <PaymentHistory order={order} />
          </section>
        </div>
        <div className="space-y-6">
          {order.status !== 'cancelled' && (
            <form onSubmit={submitUpdate} className="card space-y-3 p-5">
              <h2 className="font-medium">อัปเดตคำสั่งซื้อ</h2>
              {options.length > 0 && (
                <div>
                  <label className="label" htmlFor="status">เปลี่ยนสถานะเป็น</label>
                  <select id="status" className="input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as OrderStatus)}>
                    <option value="">— คงสถานะเดิม ({ORDER_STATUS[order.status].label}) —</option>
                    {options.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS[s].label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label" htmlFor="tracking">เลขพัสดุ</label>
                <input id="tracking" className="input font-mono" placeholder="เช่น TH1234567890" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                {nextStatus === 'shipped' && !tracking && <p className="mt-1 text-xs text-amber-300">ต้องระบุเลขพัสดุก่อนเปลี่ยนเป็น “จัดส่งแล้ว”</p>}
              </div>
              <button className="btn-primary w-full" disabled={busy}>บันทึก</button>
            </form>
          )}
          <section className="card p-5">
            <h2 className="mb-3 font-medium">ลูกค้า</h2>
            <p className="text-sm">{order.user.fullName}</p>
            <p className="text-sm text-muted">{order.user.email} {order.user.phone && `· ${order.user.phone}`}</p>
          </section>
          <section className="card p-5">
            <h2 className="mb-3 font-medium">ที่อยู่จัดส่ง</h2>
            <ShippingInfo order={order} />
          </section>
        </div>
      </div>
    </div>
  );
}
