'use client';

import { BadgeCheck, CreditCard, Minus, PackageCheck, Plus, Truck } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ProductDetails } from '@/components/ProductDetails';
import { ProductGallery } from '@/components/ProductGallery';
import { ReviewForm } from '@/components/ReviewForm';
import { ErrorBox, Spinner, Stars } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cart, OrderOptions, Product, Review } from '@/lib/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setCart, toast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mine, setMine] = useState<{ eligible: boolean; review: Review | null } | null>(null);
  const [options, setOptions] = useState<OrderOptions | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<Product>(`/products/${id}`).then(setProduct).catch((e) => setError(errorMessage(e)));
    api.get<Review[]>(`/products/${id}/reviews`).then(setReviews).catch(() => {});
  }, [id]);

  useEffect(load, [load]);
  useEffect(() => {
    api.get<OrderOptions>('/orders/options').then(setOptions).catch(() => {});
  }, []);
  useEffect(() => {
    if (user) api.get<typeof mine>(`/products/${id}/reviews/mine`).then(setMine).catch(() => {});
    else setMine(null);
  }, [id, user]);

  if (error) return <ErrorBox message={error} />;
  if (!product) return <Spinner />;

  const out = product.stockQuantity === 0;
  const standard = options?.shippingMethods.standard;

  const addToCart = async (goToCart = false) => {
    if (!user) return router.push(`/login?next=/products/${id}`);
    setAdding(true);
    try {
      const cart = await api.post<Cart>('/cart/items', { productId: product.id, quantity: qty });
      setCart(cart);
      toast(`เพิ่ม ${product.name} ลงในถุงแล้ว`);
      if (goToCart) router.push('/cart');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setAdding(false);
    }
  };

  const infoRows = [
    {
      icon: Truck,
      title: options ? `ส่งฟรีเมื่อซื้อครบ ${formatPrice(options.freeShippingMin)}` : 'จัดส่งทั่วประเทศ',
      text: standard ? `จัดส่งแบบธรรมดา ${formatPrice(standard.fee)} · ส่งด่วนได้ในขั้นตอนชำระเงิน` : 'เลือกวิธีจัดส่งได้ในขั้นตอนชำระเงิน',
    },
    { icon: CreditCard, title: 'โอนผ่านธนาคารหรือพร้อมเพย์', text: 'แนบสลิปได้ทันทีหลังสั่งซื้อ' },
    { icon: PackageCheck, title: 'ติดตามพัสดุได้', text: 'ดูสถานะและเลขพัสดุในหน้าคำสั่งซื้อ' },
  ];

  return (
    <div className="space-y-16">
      <nav className="text-sm text-muted">
        <Link href="/products" className="hover:text-ink">ร้านค้า</Link>
        {product.category && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      {/* Mobile order follows the DOM (gallery, buy panel, details); on lg the panel sits in column 2 across both rows. */}
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-x-14">
        <ProductGallery key={product.id} product={product} />

        <div className="lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
            <p className="text-sm font-medium text-warn">เหลือเพียง {product.stockQuantity} ชิ้น</p>
          )}
          <h1 className="mt-1 text-4xl font-semibold leading-tight tracking-tight">{product.name}</h1>
          {product.rating.count > 0 && (
            <a href="#reviews" className="mt-2 flex items-center gap-2 text-sm text-muted hover:text-ink">
              <Stars value={product.rating.avg} /> {product.rating.avg.toFixed(1)} · {product.rating.count} รีวิว
            </a>
          )}
          <p className="mt-5 text-2xl">{formatPrice(product.price)}</p>
          <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8 space-y-3">
            {out ? (
              <button className="btn-primary w-full py-3" disabled>สินค้าหมด</button>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-2xl bg-surface px-4 py-2">
                  <span className="text-sm text-muted">จำนวน</span>
                  <div className="flex items-center gap-4">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-40"
                      disabled={qty <= 1}
                      onClick={() => setQty(qty - 1)}
                      aria-label="ลดจำนวน"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-medium">{qty}</span>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-40"
                      disabled={qty >= product.stockQuantity}
                      onClick={() => setQty(qty + 1)}
                      aria-label="เพิ่มจำนวน"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button className="btn-primary w-full py-3 text-[17px]" disabled={adding} onClick={() => addToCart()}>
                  เพิ่มลงในถุง
                </button>
                <button className="btn-secondary w-full py-3 text-[17px]" disabled={adding} onClick={() => addToCart(true)}>
                  ซื้อเลย
                </button>
              </>
            )}
          </div>

          <ul className="mt-8 divide-y divide-line/70 border-t border-line/70">
            {infoRows.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 py-4">
                <Icon size={22} className="mt-0.5 shrink-0 text-muted" strokeWidth={1.6} />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">SKU {product.sku}</p>
        </div>

        <div className="lg:col-start-1">
          <ProductDetails product={product} />
        </div>
      </div>

      <section id="reviews" className="scroll-mt-20 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="section-title">
            รีวิวจากลูกค้า.
            <span className="text-muted"> จากผู้ที่ซื้อสินค้าจริง</span>
          </h2>
          {product.rating.count > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-4xl font-semibold tracking-tight">{product.rating.avg.toFixed(1)}</span>
              <div className="text-sm text-muted">
                <Stars value={product.rating.avg} />
                <p>{product.rating.count} รีวิว</p>
              </div>
            </div>
          )}
        </div>

        {mine?.eligible && (
          <ReviewForm
            productId={product.id}
            existing={mine.review}
            onSaved={(r) => {
              setMine({ eligible: true, review: r });
              load();
            }}
            onDeleted={() => {
              setMine({ eligible: true, review: null });
              load();
            }}
          />
        )}
        {user && mine && !mine.eligible && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <BadgeCheck size={16} /> คุณจะรีวิวสินค้านี้ได้หลังจากได้รับสินค้าแล้ว
          </p>
        )}

        {reviews.length === 0 ? (
          <div className="card p-8 text-center text-muted">ยังไม่มีรีวิวสำหรับสินค้านี้</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card p-6">
                <Stars value={r.rating} size={13} />
                {r.comment && <p className="mt-3 whitespace-pre-line leading-relaxed">{r.comment}</p>}
                <p className="mt-4 text-xs text-muted">
                  {r.user.fullName} · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
