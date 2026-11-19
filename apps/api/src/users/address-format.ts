export type AddressParts = {
  addressLine: string;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
};

const BANGKOK = 'กรุงเทพมหานคร';

/**
 * One-line Thai postal address, e.g. "52/327 ม.3 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120".
 * Bangkok uses แขวง/เขต and no จ. prefix. Legacy rows with only addressLine fall back to it.
 */
export function formatAddress(a: AddressParts): string {
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
