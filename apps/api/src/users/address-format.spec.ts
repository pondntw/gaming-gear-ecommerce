import { formatAddress } from './address-format';

describe('formatAddress', () => {
  it('uses ต./อ./จ. outside Bangkok', () => {
    expect(
      formatAddress({
        addressLine: '52/327 ม.3 ถ.พหลโยธิน',
        subdistrict: 'คลองหนึ่ง',
        district: 'คลองหลวง',
        province: 'ปทุมธานี',
        postalCode: '12120',
      }),
    ).toBe('52/327 ม.3 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120');
  });

  it('uses แขวง/เขต and no จ. prefix in Bangkok', () => {
    expect(
      formatAddress({
        addressLine: '1 ถ.สนามไชย',
        subdistrict: 'พระบรมมหาราชวัง',
        district: 'พระนคร',
        province: 'กรุงเทพมหานคร',
        postalCode: '10200',
      }),
    ).toBe('1 ถ.สนามไชย แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพมหานคร 10200');
  });

  it('falls back to the single legacy line when the parts are empty', () => {
    expect(formatAddress({ addressLine: '52/327 ก.โยธิน', subdistrict: '', district: '', province: '', postalCode: '' })).toBe(
      '52/327 ก.โยธิน',
    );
  });
});
