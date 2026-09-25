'use client';

import { AlertTriangle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Empty, ErrorBox, PageTitle, ProductImage, RequireAuth, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cart } from '@/lib/types';

function CartView() {
  const { setCart: setCartCount, toast } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    api.get<Cart>('/cart').then(setCart).catch((e) => setError(errorMessage(e)));
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
      <>
        <PageTitle>MY CART</PageTitle>
        <Empty icon={ShoppingCart} title="ตะกร้าสินค้าว่างอยู่">
          <Link href="/products" className="btn-primary">เลือกซื้อสินค้า</Link>
        </Empty>
      </>
    );
  }

  const hasProblem = cart.items.some((i) => !i.available);

  return (
    <>
      <PageTitle sub={`${cart.itemCount} ชิ้น`}>MY CART</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className={`card flex gap-4 p-3 ${busyId === item.id ? 'opacity-60' : ''}`}>
              <Link href={`/products/${item.productId}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductImage src={item.product.imageUrl} category={item.product.category?.name} alt={item.product.name} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/products/${item.productId}`} className="font-medium hover:text-neon-cyan">
                  {item.product.name}
                </Link>
                <span className="text-sm text-muted">{formatPrice(item.product.price)} / ชิ้น</span>
                {!item.available && (
                  <span className="flex items-center gap-1 text-sm text-amber-300">
                    <AlertTriangle size={14} />
                    {item.product.isActive ? `เหลือเพียง ${item.product.stockQuantity} ชิ้น` : 'สินค้านี้ไม่มีจำหน่ายแล้ว'}
                  </span>
                )}
                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border border-line">
                    <button
                      className="p-2 hover:text-neon-cyan disabled:opacity-40"
                      disabled={item.quantity <= 1 || busyId !== null}
                      onClick={() => mutate(item.id, () => api.patch(`/cart/items/${item.id}`, { quantity: item.quantity - 1 }))}
                      aria-label="ลดจำนวน"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      className="p-2 hover:text-neon-cyan disabled:opacity-40"
                      disabled={busyId !== null}
                      onClick={() => mutate(item.id, () => api.patch(`/cart/items/${item.id}`, { quantity: item.quantity + 1 }))}
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-semibold text-neon-pink">{formatPrice(item.product.price * item.quantity)}</span>
                  <button
                    className="p-2 text-muted hover:text-red-400"
                    disabled={busyId !== null}
                    onClick={() => mutate(item.id, () => api.del(`/cart/items/${item.id}`))}
                    aria-label="ลบออกจากตะกร้า"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <h2 className="font-medium">สรุปตะกร้า</h2>
          <div className="flex justify-between">
            <span className="text-muted">ยอดรวมสินค้า</span>
            <span className="text-lg font-semibold">{formatPrice(cart.subtotal)}</span>
          </div>
          <p className="text-xs text-muted">ค่าจัดส่งคำนวณในขั้นตอนถัดไป</p>
          {hasProblem && <ErrorBox message="มีสินค้าบางรายการที่สต็อกไม่พอ กรุณาปรับจำนวนหรือลบออกก่อน" />}
          {hasProblem ? (
            <button className="btn-primary w-full py-2.5" disabled>ดำเนินการสั่งซื้อ</button>
          ) : (
            <Link href="/checkout" className="btn-primary w-full py-2.5">ดำเนินการสั่งซื้อ</Link>
          )}
        </aside>
      </div>
    </>
  );
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartView />
    </RequireAuth>
  );
}
