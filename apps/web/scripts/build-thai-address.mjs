// Builds public/data/thai-address.json (province → district → subdistrict + postal code) for the address form.
// Source: https://github.com/kongvut/thai-province-data (MIT licence).
// Usage: node apps/web/scripts/build-thai-address.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE =
  'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/data/thai-address.json');

const byThai = (a, b) => a.n.localeCompare(b.n, 'th');
const live = (x) => !x.deleted_at;

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
const provinces = await res.json();

// Compact shape: [{ p: province, d: [{ n: district, s: [{ n: subdistrict, z: postalCode }] }] }]
// Bangkok district names carry a "เขต" prefix in the source; strip it so every district is stored bare
// and the UI/formatter adds เขต/อ. consistently.
const data = provinces
  .filter(live)
  .map((p) => ({
    p: p.name_th.trim(),
    d: p.districts
      .filter(live)
      .map((d) => ({
        n: d.name_th.trim().replace(/^เขต/, ''),
        s: d.sub_districts
          .filter(live)
          .map((s) => ({ n: s.name_th.trim(), z: String(s.zip_code ?? '').padStart(5, '0') }))
          .sort(byThai),
      }))
      .sort(byThai),
  }))
  .sort((a, b) => a.p.localeCompare(b.p, 'th'));

const counts = data.reduce(
  (c, p) => ({ d: c.d + p.d.length, s: c.s + p.d.reduce((n, d) => n + d.s.length, 0) }),
  { d: 0, s: 0 },
);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data));
console.log(`Wrote ${OUT}: ${data.length} provinces, ${counts.d} districts, ${counts.s} subdistricts`);
