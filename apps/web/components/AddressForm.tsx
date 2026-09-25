'use client';

import { FormEvent, useState } from 'react';
import type { Address } from '@/lib/types';

export type AddressInput = Omit<Address, 'id'>;

export function AddressForm({
  initial,
  submitLabel = 'บันทึกที่อยู่',
  onSubmit,
  onCancel,
}: {
  initial?: Partial<AddressInput>;
  submitLabel?: string;
  onSubmit: (a: AddressInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<AddressInput>({
    recipientName: initial?.recipientName ?? '',
    phone: initial?.phone ?? '',
    addressLine: initial?.addressLine ?? '',
    isDefault: initial?.isDefault ?? false,
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="recipientName">ชื่อผู้รับ</label>
          <input id="recipientName" className="input" required minLength={2} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="addrPhone">เบอร์โทรศัพท์</label>
          <input id="addrPhone" type="tel" className="input" required minLength={9} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="addressLine">ที่อยู่จัดส่ง</label>
        <textarea
          id="addressLine"
          className="input min-h-20"
          required
          minLength={10}
          placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-[#22e3ff]" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
        ตั้งเป็นที่อยู่หลัก
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>ยกเลิก</button>}
      </div>
    </form>
  );
}
