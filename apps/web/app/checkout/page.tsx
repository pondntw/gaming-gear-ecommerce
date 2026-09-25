'use client';

import { MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddressForm } from '@/components/AddressForm';
import { ErrorBox, PageTitle, RequireAuth, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Address, Cart, Order, OrderOptions } from '@/lib/types';

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

  const method = options.shippingMethods[shippingMethod];
  const fee = shippingMethod === 'standard' && cart.subtotal >= options.freeShippingMin ? 0 : method.fee;

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
    <>
      <PageTitle sub="ตรวจสอบที่อยู่ วิธีจัดส่ง และยอดชำระ">CHECKOUT</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-medium">
              <MapPin size={18} className="text-neon-cyan" /> 1. ที่อยู่จัดส่ง
            </h2>
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                    addressId === a.id ? 'border-neon-cyan bg-neon-cyan/5' : 'border-line hover:border-slate-500'
                  }`}
                >
                  <input type="radio" name="address" className="mt-1 accent-[#22e3ff]" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <span className="text-sm">
                    <span className="font-medium">{a.recipientName}</span> · {a.phone}
                    {a.isDefault && <span className="ml-2 text-xs text-neon-cyan">ที่อยู่หลัก</span>}
                    <span className="block text-muted">{a.addressLine}</span>
                  </span>
                </label>
              ))}
            </div>
            {adding ? (
              <div className="mt-4 rounded-lg border border-line p-4">
                <AddressForm
                  initial={{ isDefault: addresses.length === 0 }}
                  submitLabel="บันทึกและใช้ที่อยู่นี้"
                  onCancel={addresses.length ? () => setAdding(false) : undefined}
                  onSubmit={async (input) => {
                    try {
                      const a = await api.post<Address>('/me/addresses', input);
                      const list = await api.get<Address[]>('/me/addresses');
                      setAddresses(list);
                      setAddressId(a.id);
                      setAdding(false);
                    } catch (e) {
                      toast(errorMessage(e), 'error');
                    }
                  }}
                />
              </div>
            ) : (
              <button className="btn-ghost mt-3" onClick={() => setAdding(true)}>
                <Plus size={16} /> เพิ่มที่อยู่ใหม่
              </button>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-medium">2. วิธีจัดส่ง</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(options.shippingMethods).map(([key, m]) => {
                const f = key === 'standard' && cart.subtotal >= options.freeShippingMin ? 0 : m.fee;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${
                      shippingMethod === key ? 'border-neon-cyan bg-neon-cyan/5' : 'border-line hover:border-slate-500'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <input type="radio" name="ship" className="accent-[#22e3ff]" checked={shippingMethod === key} onChange={() => setShippingMethod(key)} />
                      {m.label}
                    </span>
                    <span className="text-sm font-medium">{f === 0 ? 'ฟรี' : formatPrice(f)}</span>
                  </label>
                );
              })}
            </div>
            {cart.subtotal < options.freeShippingMin && (
              <p className="mt-3 text-xs text-muted">
                ส่งแบบธรรมดาฟรีเมื่อซื้อครบ {formatPrice(options.freeShippingMin)}
              </p>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <h2 className="font-medium">3. สรุปคำสั่งซื้อ</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-slate-300">
                  {i.product.name} <span className="text-muted">×{i.quantity}</span>
                </span>
                <span className="shrink-0">{formatPrice(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">ยอดรวมสินค้า</span><span>{formatPrice(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted">ค่าจัดส่ง</span><span>{fee === 0 ? 'ฟรี' : formatPrice(fee)}</span></div>
          </div>
          <div className="flex justify-between border-t border-line pt-3">
            <span>ยอดชำระทั้งหมด</span>
            <span className="text-xl font-bold text-neon-pink">{formatPrice(cart.subtotal + fee)}</span>
          </div>
          <button className="btn-primary w-full py-3" disabled={placing || !addressId} onClick={placeOrder}>
            {placing ? 'กำลังสร้างคำสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
          </button>
          <p className="text-xs text-muted">หลังยืนยัน คุณจะชำระเงินและแนบสลิปได้ที่หน้าคำสั่งซื้อ</p>
          <Link href="/cart" className="block text-center text-sm text-neon-cyan hover:underline">← กลับไปแก้ไขตะกร้า</Link>
        </aside>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutView />
    </RequireAuth>
  );
}
