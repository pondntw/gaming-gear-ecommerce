'use client';

import { useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { Review } from '@/lib/types';
import { StarInput } from './ui';

export function ReviewForm({
  productId,
  existing,
  onSaved,
  onDeleted,
}: {
  productId: number;
  existing: Review | null;
  onSaved: (r: Review) => void;
  onDeleted?: () => void;
}) {
  const { toast } = useStore();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!rating) return toast('กรุณาให้คะแนนอย่างน้อย 1 ดาว', 'error');
    setBusy(true);
    try {
      const r = await api.put<Review>(`/products/${productId}/reviews/mine`, { rating, comment });
      toast(existing ? 'แก้ไขรีวิวแล้ว' : 'ขอบคุณสำหรับรีวิว!');
      onSaved(r);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('ลบรีวิวนี้?')) return;
    setBusy(true);
    try {
      await api.del(`/products/${productId}/reviews/mine`);
      toast('ลบรีวิวแล้ว');
      setRating(0);
      setComment('');
      onDeleted?.();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3 border-accent/50 p-4">
      <p className="font-medium">{existing ? 'แก้ไขรีวิวของคุณ' : 'เขียนรีวิวสินค้านี้'}</p>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        className="input min-h-24"
        placeholder="เล่าประสบการณ์การใช้งาน (ไม่บังคับ)"
        maxLength={2000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy} onClick={save}>
          {existing ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
        </button>
        {existing && onDeleted && (
          <button className="btn-danger" disabled={busy} onClick={remove}>
            ลบรีวิว
          </button>
        )}
      </div>
    </div>
  );
}
