'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BANGKOK, loadThaiAddress, type ThaiProvince } from '@/lib/address';
import type { Address } from '@/lib/types';

export type AddressInput = Omit<Address, 'id'>;

const EMPTY: AddressInput = {
  recipientName: '',
  phone: '',
  addressLine: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  isDefault: false,
};

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
  const [form, setForm] = useState<AddressInput>({ ...EMPTY, ...initial });
  const [data, setData] = useState<ThaiProvince[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadThaiAddress()
      .then(setData)
      .catch((e) => setLoadError(e.message));
  }, []);

  const districts = useMemo(() => data?.find((p) => p.p === form.province)?.d ?? [], [data, form.province]);
  const subdistricts = useMemo(() => districts.find((d) => d.n === form.district)?.s ?? [], [districts, form.district]);
  const bkk = form.province === BANGKOK;

  const set = (patch: Partial<AddressInput>) => setForm((f) => ({ ...f, ...patch }));
  // Picking a higher level clears everything below it; picking a subdistrict fills its postal code.
  const pickProvince = (province: string) => set({ province, district: '', subdistrict: '', postalCode: '' });
  const pickDistrict = (district: string) => set({ district, subdistrict: '', postalCode: '' });
  const pickSubdistrict = (subdistrict: string) =>
    set({ subdistrict, postalCode: subdistricts.find((s) => s.n === subdistrict)?.z ?? '' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ ...form, addressLine: form.addressLine.trim(), postalCode: form.postalCode.trim() });
    } finally {
      setBusy(false);
    }
  };

  const placeholder = (text: string) => (data ? text : loadError ? 'โหลดข้อมูลไม่สำเร็จ' : 'กำลังโหลด...');

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="recipientName">ชื่อผู้รับ</label>
          <input id="recipientName" className="input" required minLength={2} autoComplete="name" value={form.recipientName} onChange={(e) => set({ recipientName: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="addrPhone">เบอร์โทรศัพท์</label>
          <input id="addrPhone" type="tel" className="input" required minLength={9} autoComplete="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="addressLine">บ้านเลขที่ / หมู่ / ซอย / ถนน</label>
        <input
          id="addressLine"
          className="input"
          required
          minLength={3}
          autoComplete="address-line1"
          placeholder="เช่น 52/327 หมู่ 3 ซอยพหลโยธิน 87 ถนนพหลโยธิน"
          value={form.addressLine}
          onChange={(e) => set({ addressLine: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="province">จังหวัด</label>
          <select id="province" className="input" required disabled={!data} value={form.province} onChange={(e) => pickProvince(e.target.value)}>
            <option value="">{placeholder('เลือกจังหวัด')}</option>
            {data?.map((p) => (
              <option key={p.p} value={p.p}>{p.p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="district">{bkk ? 'เขต' : 'อำเภอ'}</label>
          <select id="district" className="input" required disabled={!form.province} value={form.district} onChange={(e) => pickDistrict(e.target.value)}>
            <option value="">{form.province ? `เลือก${bkk ? 'เขต' : 'อำเภอ'}` : 'เลือกจังหวัดก่อน'}</option>
            {districts.map((d) => (
              <option key={d.n} value={d.n}>{d.n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="subdistrict">{bkk ? 'แขวง' : 'ตำบล'}</label>
          <select id="subdistrict" className="input" required disabled={!form.district} value={form.subdistrict} onChange={(e) => pickSubdistrict(e.target.value)}>
            <option value="">{form.district ? `เลือก${bkk ? 'แขวง' : 'ตำบล'}` : `เลือก${bkk ? 'เขต' : 'อำเภอ'}ก่อน`}</option>
            {subdistricts.map((s) => (
              <option key={s.n} value={s.n}>{s.n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="postalCode">รหัสไปรษณีย์</label>
          {/* Auto-filled from the subdistrict but still editable: a few areas use more than one code. */}
          <input
            id="postalCode"
            className="input"
            required
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            autoComplete="postal-code"
            title="ตัวเลข 5 หลัก"
            value={form.postalCode}
            onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, '') })}
          />
        </div>
      </div>
      {loadError && <p className="text-sm text-danger">{loadError} กรุณารีเฟรชหน้าอีกครั้ง</p>}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-accent" checked={form.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />
        ตั้งเป็นที่อยู่หลัก
      </label>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>ยกเลิก</button>}
      </div>
    </form>
  );
}
