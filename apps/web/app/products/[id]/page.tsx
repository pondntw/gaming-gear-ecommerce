'use client';

import { Minus, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ReviewForm } from '@/components/ReviewForm';
import { ProductGallery } from '@/components/ProductGallery';
import { ErrorBox, Spinner, Stars } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Cart, Product, Review } from '@/lib/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, setCart, toast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mine, setMine] = useState<{ eligible: boolean; review: Review | null } | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<Product>(`/products/${id}`).then(setProduct).catch((e) => setError(errorMessage(e)));
    api.get<Review[]>(`/products/${id}/reviews`).then(setReviews).catch(() => {});
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    if (user) api.get<typeof mine>(`/products/${id}/reviews/mine`).then(setMine).catch(() => {});
    else setMine(null);
  }, [id, user]);

  if (error) return <ErrorBox message={error} />;
  if (!product) return <Spinner />;

  const out = product.stockQuantity === 0;

  const addToCart = async (goToCart = false) => {
    if (!user) return router.push(`/login?next=/products/${id}`);
    setAdding(true);
    try {
      const cart = await api.post<Cart>('/cart/items', { productId: product.id, quantity: qty });
      setCart(cart);
      toast(`เพิ่ม ${product.name} ลงตะกร้าแล้ว`);
      if (goToCart) router.push('/cart');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-12">
      <nav className="text-sm text-muted">
        <Link href="/products" className="hover:text-white">สินค้า</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/products?categoryId=${product.category.id}`} className="hover:text-white">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery key={product.id} product={product} />

        <div className="flex flex-col gap-4">
          <span className="text-sm uppercase tracking-widest text-neon-cyan">{product.category?.name}</span>
          <h1 className="text-3xl font-semibold leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Stars value={product.rating.avg} />
            <span>
              {product.rating.avg.toFixed(1)} · {product.rating.count} รีวิว · SKU {product.sku}
            </span>
          </div>
          <p className="text-3xl font-bold text-neon-pink">{formatPrice(product.price)}</p>
          <p className={out ? 'text-red-300' : product.stockQuantity <= 5 ? 'text-amber-300' : 'text-emerald-300'}>
            {out ? 'สินค้าหมด' : `มีสินค้า ${product.stockQuantity} ชิ้น`}
          </p>
          <p className="whitespace-pre-line leading-relaxed text-slate-300">{product.description}</p>

          {!out && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-line">
                <button className="p-2.5 hover:text-neon-cyan" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="ลดจำนวน">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center">{qty}</span>
                <button
                  className="p-2.5 hover:text-neon-cyan"
                  onClick={() => setQty(Math.min(product.stockQuantity, qty + 1))}
                  aria-label="เพิ่มจำนวน"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button className="btn-cyan py-2.5" disabled={adding} onClick={() => addToCart()}>
                <ShoppingCart size={18} /> เพิ่มลงตะกร้า
              </button>
              <button className="btn-primary py-2.5" disabled={adding} onClick={() => addToCart(true)}>
                ซื้อเลย
              </button>
            </div>
          )}
        </div>
      </div>

      <section>
        <h2 className="neon-title mb-5 text-xl">REVIEWS</h2>
        {mine?.eligible && (
          <div className="mb-6">
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
          </div>
        )}
        {user && mine && !mine.eligible && (
          <p className="mb-4 text-sm text-muted">คุณจะรีวิวสินค้านี้ได้หลังจากได้รับสินค้าแล้ว</p>
        )}
        {reviews.length === 0 ? (
          <p className="text-muted">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{r.user.fullName}</span>
                  <Stars value={r.rating} size={13} />
                  <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-2 whitespace-pre-line text-slate-300">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
