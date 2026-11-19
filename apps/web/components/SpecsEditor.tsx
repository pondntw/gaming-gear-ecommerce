'use client';

import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { ProductSpec } from '@/lib/types';

/** Editable label/value rows for the product spec table. */
export function SpecsEditor({ specs, onChange }: { specs: ProductSpec[]; onChange: (specs: ProductSpec[]) => void }) {
  const update = (i: number, patch: Partial<ProductSpec>) => onChange(specs.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= specs.length) return;
    const next = [...specs];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {specs.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="input w-40 shrink-0 py-2"
            placeholder="หัวข้อ เช่น น้ำหนัก"
            aria-label={`หัวข้อสเปกแถวที่ ${i + 1}`}
            value={s.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <input
            className="input py-2"
            placeholder="ค่า เช่น 60 กรัม"
            aria-label={`ค่าสเปกแถวที่ ${i + 1}`}
            value={s.value}
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <div className="flex shrink-0 flex-col">
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="เลื่อนขึ้น" className="text-muted hover:text-ink disabled:opacity-30">
              <ChevronUp size={14} />
            </button>
            <button type="button" onClick={() => move(i, i + 1)} disabled={i === specs.length - 1} aria-label="เลื่อนลง" className="text-muted hover:text-ink disabled:opacity-30">
              <ChevronDown size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange(specs.filter((_, j) => j !== i))}
            aria-label={`ลบแถวที่ ${i + 1}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted hover:text-danger"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="link flex items-center gap-1 text-sm" onClick={() => onChange([...specs, { label: '', value: '' }])}>
        <Plus size={14} /> เพิ่มแถว
      </button>
    </div>
  );
}
