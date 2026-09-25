'use client';

import { Check, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { AddressForm } from '@/components/AddressForm';
import { ErrorBox, ProductImage, RequireAuth, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Address, Cart, Order, OrderOptions } from '@/lib/types';

/** Large selectable tile with a blue ring when chosen, like Apple's configurator options. */
function Choice({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative w-full rounded-2xl border bg-white p-5 text-left transition ${
        selected ? 'border-accent ring-1 ring-accent' : 'border-line hover:border-muted'
      }`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">
        <span className="text-muted">{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

function CheckoutView() {
  const router = useRouter();
  const { refreshCart, toast } = useStore();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([api.get<Cart>('/cart'), api.get<Address[]>('/me/addresses'), api.get<OrderOptions>('/orders/options')])
      .then(([c, a, o]) => {
        if (!c.items.length) return router.replace('/cart');
        setCart(c);
        setAddresses(a);
        setOptions(o);
        setAddressId(a.find((x) => x.isDefault)?.id ?? a[0]?.id ?? null);
        setAdding(a.length === 0);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [router]);

  if (error) return <ErrorBox message={error} />;
  if (!cart || !options) return <Spinner />;

  const feeFor = (key: string) =>
    key === 'standard' && cart.subtotal >= options.freeShippingMin ? 0 : options.shippingMethods[key].fee;
  const fee = feeFor(shippingMethod);

  const placeOrder = async () => {
    if (!addressId) return toast('กรุณาเลือกที่อยู่จัดส่ง', 'error');
    setPlacing(true);
    try {
      const order = await api.post<Order>('/orders/checkout', { addressId, shippingMethod });
      await refreshCart();
      toast('สร้างคำสั่งซื้อสำเร็จ กรุณาชำระเงิน');
      router.push(`/orders/${order.id}`);
    } catch (e) {
      toast(errorMessage(e), 'error');
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <Link href="/cart" className="link text-sm">‹ กลับไปที่ถุง</Link>
        <h1 className="headline mt-3">ชำระเงิน</h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          <Step n={1} title="จัดส่งไปที่ไหน">
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <Choice key={a.id} selected={addressId === a.id} onSelect={() => setAddressId(a.id)}>
                  <p className="pr-8 font-medium">{a.recipientName}</p>
                  <p className="text-sm text-muted">{a.phone}</p>
                  <p className="mt-2 text-sm">{a.addressLine}</p>
                  {a.isDefault && <p className="mt-2 text-xs text-muted">ที่อยู่หลัก</p>}
                </Choice>
              ))}
            </div>
            {adding ? (
              <div className="card p-6">
                <AddressForm
                  initial={{ isDefault: addresses.length === 0 }}
                  submitLabel="บันทึกและใช้ที่อยู่นี้"
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                  onSubmit={async (input) => {
                    try {
                      const a = await api.post<Address>('/me/addresses', input);
                      setAddresses(await api.get<Address[]>('/me/addresses'));
                      setAddressId(a.id);
                      setAdding(false);
                    } catch (e) {
                      toast(errorMessage(e), 'error');
                    }
                  }}
                />
              </div>
            ) : (
              <button className="link flex items-center gap-1 text-sm" onClick={() => setAdding(true)}>
                <Plus size={15} /> เพิ่มที่อยู่ใหม่
              </button>
            )}
          </Step>

          <Step n={2} title="จัดส่งอย่างไร">
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(options.shippingMethods).map(([key, m]) => {
                const f = feeFor(key);
                return (
                  <Choice key={key} selected={shippingMethod === key} onSelect={() => setShippingMethod(key)}>
                    <p className="pr-8 font-medium">{m.label}</p>
                    <p className="mt-1 text-sm text-muted">{f === 0 ? 'ฟรี' : formatPrice(f)}</p>
                  </Choice>
                );
              })}
            </div>
            {cart.subtotal < options.freeShippingMin && (
              <p className="text-sm text-muted">ส่งแบบธรรมดาฟรีเมื่อซื้อครบ {formatPrice(options.freeShippingMin)}</p>
            )}
          </Step>
        </div>

        <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-20">
          <h2 className="text-xl font-semibold tracking-tight">สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-4">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface">
                  <ProductImage src={i.product.imageUrl} category={i.product.category?.name} alt="" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.product.name}</p>
                  <p className="text-muted">จำนวน {i.quantity}</p>
                </div>
                <span className="shrink-0">{formatPrice(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">ยอดรวมย่อย</dt><dd>{formatPrice(cart.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">ค่าจัดส่ง</dt><dd>{fee === 0 ? 'ฟรี' : formatPrice(fee)}</dd></div>
          </dl>
          <div className="flex justify-between border-t border-line pt-4 text-xl font-semibold tracking-tight">
            <span>ยอดรวม</span>
            <span>{formatPrice(cart.subtotal + fee)}</span>
          </div>
          <button className="btn-primary w-full py-3 text-[17px]" disabled={placing || !addressId} onClick={placeOrder}>
            {placing ? 'กำลังสร้างคำสั่งซื้อ...' : 'สั่งซื้อ'}
          </button>
          <p className="text-center text-xs text-muted">หลังสั่งซื้อ คุณจะชำระเงินและแนบสลิปได้ที่หน้าคำสั่งซื้อ</p>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutView />
    </RequireAuth>
  );
}
