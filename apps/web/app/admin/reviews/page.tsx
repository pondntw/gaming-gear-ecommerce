'use client';

import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner, Stars } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Review } from '@/lib/types';

export default function AdminReviewsPage() {
  const { toast } = useStore();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [rating, setRating] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<Review[]>('/admin/reviews', { rating }).then(setReviews).catch((e) => setError(errorMessage(e)));
  }, [rating]);
  useEffect(load, [load]);

  const remove = async (r: Review) => {
    if (!confirm('ลบรีวิวนี้?')) return;
    try {
      await api.del(`/admin/reviews/${r.id}`);
      toast('ลบรีวิวแล้ว');
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle sub="ตรวจสอบและจัดการรีวิวสินค้า">REVIEWS</PageTitle>
        <select className="input w-auto" value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">ทุกคะแนน</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ดาว</option>
          ))}
        </select>
      </div>
      {!reviews ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <p className="text-muted">ไม่มีรีวิว</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card flex gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/products/${r.productId}`} className="font-medium text-neon-cyan hover:underline">
                    {r.product?.name}
                  </Link>
                  <Stars value={r.rating} size={13} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  โดย {r.user.fullName} · {formatDate(r.createdAt)}
                </p>
                {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{r.comment}</p>}
              </div>
              <button className="btn-danger h-fit px-2 py-1" title="ลบรีวิว" onClick={() => remove(r)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
