import { Check, XCircle } from 'lucide-react';
import { formatDate, formatPrice, ORDER_STATUS, STATUS_FLOW } from '@/lib/format';
import type { Order } from '@/lib/types';
import { PaymentBadge, ProductImage } from './ui';

export function OrderTimeline({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-danger">
        <XCircle size={18} /> คำสั่งซื้อนี้ถูกยกเลิกแล้ว
      </div>
    );
  }
  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <div className={`h-[2px] flex-1 ${i === 0 ? 'invisible' : done ? 'bg-accent' : 'bg-line'}`} />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done ? 'bg-accent text-white' : 'bg-surface text-muted'
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <div className={`h-[2px] flex-1 ${i === STATUS_FLOW.length - 1 ? 'invisible' : i < current ? 'bg-accent' : 'bg-line'}`} />
            </div>
            <span className={`text-[11px] leading-tight sm:text-xs ${i === current ? 'font-semibold text-ink' : 'text-muted'}`}>
              {ORDER_STATUS[s].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItemsTable({ order }: { order: Order }) {
  return (
    <div>
      <div className="divide-y divide-line/70">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 py-3 first:pt-0">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
              <ProductImage src={i.product.imageUrl} alt={i.product.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{i.product.name}</p>
              <p className="text-sm text-muted">
                {formatPrice(i.unitPrice)} × {i.quantity}
              </p>
            </div>
            <span className="font-medium">{formatPrice(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
      </div>
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">ยอดรวมสินค้า</dt><dd>{formatPrice(order.subtotal)}</dd></div>
        <div className="flex justify-between">
          <dt className="text-muted">ค่าจัดส่ง ({order.shippingMethod === 'express' ? 'ด่วน' : 'ธรรมดา'})</dt>
          <dd>{order.shippingFee === 0 ? 'ฟรี' : formatPrice(order.shippingFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
          <dt>ยอดชำระ</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ShippingInfo({ order }: { order: Order }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{order.shippingName} · {order.shippingPhone}</p>
      <p className="text-muted">{order.shippingAddress}</p>
      {order.trackingNumber && (
        <p className="pt-3">
          เลขพัสดุ <span className="ml-1 rounded-md bg-surface px-2 py-0.5 font-mono text-ink">{order.trackingNumber}</span>
        </p>
      )}
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = { bank_transfer: 'โอนผ่านธนาคาร', promptpay: 'พร้อมเพย์' };

export function PaymentHistory({ order }: { order: Order }) {
  if (!order.payments.length) return <p className="text-sm text-muted">ยังไม่มีการแจ้งชำระเงิน</p>;
  return (
    <ul className="divide-y divide-line/70">
      {order.payments.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-2 py-3 text-sm first:pt-0 last:pb-0">
          <PaymentBadge status={p.status} />
          <span>{METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</span>
          <span className="text-muted">{formatPrice(p.amount)} · {formatDate(p.paidAt)}</span>
          {p.proofUrl && (
            <a href={p.proofUrl} target="_blank" rel="noreferrer" className="link ml-auto">
              ดูสลิป ›
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
