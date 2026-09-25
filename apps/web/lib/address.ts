import type { Address } from './types';

export const BANGKOK = 'กรุงเทพมหานคร';

/** Mirrors formatAddress in apps/api/src/users/address-format.ts. */
export function formatAddress(a: Pick<Address, 'addressLine' | 'subdistrict' | 'district' | 'province' | 'postalCode'>) {
  const bkk = a.province === BANGKOK;
  return [
    a.addressLine?.trim(),
    a.subdistrict && `${bkk ? 'แขวง' : 'ต.'}${a.subdistrict}`,
    a.district && `${bkk ? 'เขต' : 'อ.'}${a.district}`,
    a.province && (bkk ? a.province : `จ.${a.province}`),
    a.postalCode,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Compact dataset built by scripts/build-thai-address.mjs. */
export type ThaiProvince = { p: string; d: { n: string; s: { n: string; z: string }[] }[] };

let cache: Promise<ThaiProvince[]> | null = null;

/** Loads the province/district/subdistrict data once per session (~60 KB gzipped). */
export function loadThaiAddress(): Promise<ThaiProvince[]> {
  cache ??= fetch('/data/thai-address.json').then((r) => {
    if (!r.ok) throw new Error('โหลดข้อมูลที่อยู่ไม่สำเร็จ');
    return r.json();
  });
  cache.catch(() => (cache = null)); // allow a retry after a failed load
  return cache;
}
