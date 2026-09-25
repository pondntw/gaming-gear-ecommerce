import { Check, XCircle } from 'lucide-react';
import { formatDate, formatPrice, ORDER_STATUS, STATUS_FLOW } from '@/lib/format';
import type { Order } from '@/lib/types';
import { PaymentBadge, ProductImage } from './ui';

export function OrderTimeline({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-red-200">
        <XCircle size={18} /> คำสั่งซื้อนี้ถูกยกเลิกแล้ว
      </div>
    );
  }
  const current = STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : done ? 'bg-neon-cyan' : 'bg-line'}`} />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                  done
                    ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_12px_rgb(34_227_255/0.5)]'
                    : 'border-line text-muted'
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <div className={`h-0.5 flex-1 ${i === STATUS_FLOW.length - 1 ? 'invisible' : i < current ? 'bg-neon-cyan' : 'bg-line'}`} />
            </div>
            <span className={`text-[11px] leading-tight sm:text-xs ${i === current ? 'text-white' : 'text-muted'}`}>
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
    <div className="space-y-3">
      {order.items.map((i) => (
        <div key={i.id} className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
            <ProductImage src={i.product.imageUrl} alt={i.product.name} />
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate">{i.product.name}</p>
            <p className="text-muted">
              {formatPrice(i.unitPrice)} × {i.quantity}
            </p>
          </div>
          <span className="text-sm font-medium">{formatPrice(i.unitPrice * i.quantity)}</span>
        </div>
      ))}
      <div className="space-y-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between"><span className="text-muted">ยอดรวมสินค้า</span><span>{formatPrice(order.subtotal)}</span></div>
        <div className="flex justify-between">
          <span className="text-muted">ค่าจัดส่ง ({order.shippingMethod === 'express' ? 'ด่วน' : 'ธรรมดา'})</span>
          <span>{order.shippingFee === 0 ? 'ฟรี' : formatPrice(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base">
          <span>ยอดชำระ</span>
          <span className="font-bold text-neon-pink">{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

export function ShippingInfo({ order }: { order: Order }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium">{order.shippingName} · {order.shippingPhone}</p>
      <p className="text-muted">{order.shippingAddress}</p>
      {order.trackingNumber && (
        <p className="pt-2">
          เลขพัสดุ: <span className="font-mono text-neon-cyan">{order.trackingNumber}</span>
        </p>
      )}
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = { bank_transfer: 'โอนผ่านธนาคาร', promptpay: 'พร้อมเพย์' };

export function PaymentHistory({ order }: { order: Order }) {
  if (!order.payments.length) return <p className="text-sm text-muted">ยังไม่มีการแจ้งชำระเงิน</p>;
  return (
    <ul className="space-y-2">
      {order.payments.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-3 text-sm">
          <PaymentBadge status={p.status} />
          <span>{METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</span>
          <span className="text-muted">{formatPrice(p.amount)} · {formatDate(p.paidAt)}</span>
          {p.proofUrl && (
            <a href={p.proofUrl} target="_blank" rel="noreferrer" className="ml-auto text-neon-cyan hover:underline">
              ดูสลิป
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
