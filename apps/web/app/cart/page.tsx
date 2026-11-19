'use client';

import { AlertTriangle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Empty, ErrorBox, ProductImage, RequireAuth, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cart, OrderOptions } from '@/lib/types';

function CartView() {
  const { setCart: setCartCount, toast } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api.get<Cart>('/cart').then(setCart).catch((e) => setError(errorMessage(e)));
    api.get<OrderOptions>('/orders/options').then(setOptions).catch(() => {});
  }, []);

  const mutate = async (itemId: number, fn: () => Promise<Cart>) => {
    setBusyId(itemId);
    try {
      const c = await fn();
      setCart(c);
      setCartCount(c);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!cart) return <Spinner />;

  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-2xl">
        <Empty icon={ShoppingBag} title="ถุงของคุณว่างอยู่">
          <p className="text-muted">เลือกดูอุปกรณ์เกมมิ่งแล้วเพิ่มลงในถุงได้เลย</p>
          <Link href="/products" className="btn-primary">เลือกซื้อสินค้า</Link>
        </Empty>
      </div>
    );
  }

  const hasProblem = cart.items.some((i) => !i.available);
  const freeMin = options?.freeShippingMin ?? 0;
  const standardFee = options?.shippingMethods.standard?.fee ?? 0;
  const shipping = cart.subtotal >= freeMin ? 0 : standardFee;

  return (
    <div className="mx-auto max-w-[980px] space-y-10">
      <div className="text-center">
        <h1 className="headline">ยอดรวมในถุงของคุณคือ {formatPrice(cart.subtotal + shipping)}</h1>
        <p className="mt-3 text-muted">
          {options && cart.subtotal < freeMin
            ? `ซื้อเพิ่มอีก ${formatPrice(freeMin - cart.subtotal)} เพื่อรับสิทธิ์ส่งฟรี`
            : 'คำสั่งซื้อนี้ได้รับสิทธิ์ส่งฟรี'}
        </p>
        <Link
          href={hasProblem ? '#' : '/checkout'}
          aria-disabled={hasProblem}
          className={`btn-primary mt-6 px-10 py-3 text-[17px] ${hasProblem ? 'pointer-events-none opacity-40' : ''}`}
        >
          ชำระเงิน
        </Link>
      </div>

      {hasProblem && <ErrorBox message="มีสินค้าบางรายการที่สต็อกไม่พอ กรุณาปรับจำนวนหรือลบออกก่อนชำระเงิน" />}

      <div className="card divide-y divide-line/70 px-6 sm:px-10">
        {cart.items.map((item) => (
          <div key={item.id} className={`flex gap-6 py-8 ${busyId === item.id ? 'opacity-50' : ''}`}>
            <Link href={`/products/${item.productId}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface sm:h-36 sm:w-36">
              <ProductImage src={item.product.imageUrl} category={item.product.category?.name} alt={item.product.name} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between">
              <div className="space-y-1">
                <Link href={`/products/${item.productId}`} className="text-xl font-semibold tracking-tight hover:underline">
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted">{formatPrice(item.product.price)} ต่อชิ้น</p>
                {!item.available && (
                  <p className="flex items-center gap-1 text-sm text-warn">
                    <AlertTriangle size={14} />
                    {item.product.isActive ? `เหลือเพียง ${item.product.stockQuantity} ชิ้น` : 'สินค้านี้ไม่มีจำหน่ายแล้ว'}
                  </p>
                )}
              </div>
              <div className="flex items-start gap-6 sm:flex-col sm:items-end sm:gap-2">
                <p className="text-xl font-semibold tracking-tight">{formatPrice(item.product.price * item.quantity)}</p>
                <select
                  aria-label="จำนวน"
                  className="rounded-lg bg-surface px-3 py-1.5 text-sm outline-none"
                  disabled={busyId !== null}
                  value={item.quantity}
                  onChange={(e) =>
                    mutate(item.id, () => api.patch(`/cart/items/${item.id}`, { quantity: Number(e.target.value) }))
                  }
                >
                  {Array.from({ length: Math.max(1, item.quantity, Math.min(10, item.product.stockQuantity)) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  className="link text-sm"
                  disabled={busyId !== null}
                  onClick={() => mutate(item.id, () => api.del(`/cart/items/${item.id}`))}
                >
                  ลบออก
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ml-auto max-w-md space-y-3 px-2 text-[15px]">
        <div className="flex justify-between"><span>ยอดรวมย่อย</span><span>{formatPrice(cart.subtotal)}</span></div>
        <div className="flex justify-between">
          <span>ค่าจัดส่ง (ธรรมดา)</span>
          <span>{shipping === 0 ? 'ฟรี' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-line pt-4 text-2xl font-semibold tracking-tight">
          <span>ยอดรวม</span>
          <span>{formatPrice(cart.subtotal + shipping)}</span>
        </div>
        <p className="text-xs text-muted">เปลี่ยนเป็นส่งด่วนได้ในขั้นตอนชำระเงิน</p>
        <Link
          href={hasProblem ? '#' : '/checkout'}
          aria-disabled={hasProblem}
          className={`btn-primary w-full py-3 text-[17px] ${hasProblem ? 'pointer-events-none opacity-40' : ''}`}
        >
          ชำระเงิน
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartView />
    </RequireAuth>
  );
}
