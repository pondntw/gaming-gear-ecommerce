// Seed data shared by prisma/seed.ts and scripts/gen-sql.ts (-> supabase/schema.sql).

export const ADMIN = {
  fullName: 'Admin',
  email: 'admin@gaminggear.local',
  password: 'admin1234',
  phone: '0800000000',
};

export const CATEGORIES = ['Mouse', 'Keyboard', 'Headset', 'Monitor', 'Chair', 'Controller'];

type SeedProduct = {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
};

export const PRODUCTS: SeedProduct[] = [
  { sku: 'MS-001', name: 'Logitech G Pro X Superlight 2', category: 'Mouse', price: 5290, stock: 25, description: 'เมาส์ไร้สายน้ำหนักเบาเพียง 60 กรัม เซนเซอร์ HERO 2 ความละเอียดสูงสุด 32,000 DPI' },
  { sku: 'MS-002', name: 'Razer DeathAdder V3', category: 'Mouse', price: 2690, stock: 40, description: 'เมาส์ทรง ergonomic ยอดนิยมสำหรับเกม FPS เซนเซอร์ Focus Pro 30K' },
  { sku: 'MS-003', name: 'Zowie EC2-C', category: 'Mouse', price: 2390, stock: 0, description: 'เมาส์สายสำหรับ eSports ไม่ต้องลงไดรเวอร์ รูปทรงถนัดขวา' },
  { sku: 'MS-004', name: 'SteelSeries Aerox 3 Wireless', category: 'Mouse', price: 2990, stock: 18, description: 'เมาส์ไร้สายกันน้ำกันฝุ่น IP54 ดีไซน์รังผึ้ง' },
  { sku: 'KB-001', name: 'Wooting 60HE+', category: 'Keyboard', price: 7490, stock: 10, description: 'คีย์บอร์ดแม่เหล็ก Hall Effect ปรับระยะกดได้ รองรับ Rapid Trigger' },
  { sku: 'KB-002', name: 'Keychron Q1 Pro', category: 'Keyboard', price: 6590, stock: 15, description: 'คีย์บอร์ด 75% บอดี้อะลูมิเนียม Hot-swap เชื่อมต่อไร้สาย Bluetooth' },
  { sku: 'KB-003', name: 'Razer Huntsman V3 Pro TKL', category: 'Keyboard', price: 7990, stock: 8, description: 'สวิตช์ Analog Optical ปรับจุด actuation ได้ พร้อมที่พักข้อมือ' },
  { sku: 'KB-004', name: 'Logitech G715', category: 'Keyboard', price: 5490, stock: 12, description: 'คีย์บอร์ดไร้สาย TKL ไฟ RGB ดีไซน์น่ารัก พร้อมที่พักข้อมือแบบคลาวด์' },
  { sku: 'HS-001', name: 'HyperX Cloud III', category: 'Headset', price: 3290, stock: 30, description: 'หูฟังเกมมิ่งใส่สบาย ไมค์ตัดเสียงรบกวน รองรับ DTS Spatial Audio' },
  { sku: 'HS-002', name: 'SteelSeries Arctis Nova Pro', category: 'Headset', price: 11900, stock: 5, description: 'หูฟังระดับไฮเอนด์พร้อม GameDAC และ Active Noise Cancellation' },
  { sku: 'HS-003', name: 'Razer BlackShark V2 Pro', category: 'Headset', price: 6990, stock: 14, description: 'หูฟังไร้สายสำหรับ eSports ไดรเวอร์ TriForce Titanium 50mm' },
  { sku: 'MN-001', name: 'ASUS ROG Swift PG27AQDM', category: 'Monitor', price: 32900, stock: 4, description: 'จอ OLED 27 นิ้ว 1440p 240Hz ความเร็วตอบสนอง 0.03ms' },
  { sku: 'MN-002', name: 'BenQ ZOWIE XL2546K', category: 'Monitor', price: 16900, stock: 7, description: 'จอ TN 24.5 นิ้ว 240Hz เทคโนโลยี DyAc+ สำหรับเกม FPS' },
  { sku: 'MN-003', name: 'LG UltraGear 27GR95QE', category: 'Monitor', price: 29900, stock: 6, description: 'จอ OLED 27 นิ้ว 240Hz สีสดคมชัด รองรับ G-Sync' },
  { sku: 'CH-001', name: 'Secretlab TITAN Evo', category: 'Chair', price: 17900, stock: 9, description: 'เก้าอี้เกมมิ่งพรีเมียม ปรับ lumbar support ในตัว วัสดุ NEO Hybrid Leatherette' },
  { sku: 'CH-002', name: 'Anda Seat Kaiser 3', category: 'Chair', price: 14900, stock: 11, description: 'เก้าอี้เกมมิ่งไซซ์ใหญ่ ที่วางแขน 4D พนักพิงเอนได้ 160 องศา' },
  { sku: 'CT-001', name: 'Xbox Wireless Controller', category: 'Controller', price: 2190, stock: 35, description: 'จอยไร้สายใช้ได้ทั้ง Xbox และ PC เชื่อมต่อ Bluetooth' },
  { sku: 'CT-002', name: 'PlayStation DualSense Edge', category: 'Controller', price: 7590, stock: 8, description: 'จอยโปรสำหรับ PS5 ปุ่มหลังปรับแต่งได้ เปลี่ยนก้านอนาล็อกได้' },
  { sku: 'CT-003', name: '8BitDo Ultimate 2', category: 'Controller', price: 2290, stock: 20, description: 'จอยไร้สายก้าน Hall Effect พร้อมแท่นชาร์จ รองรับ PC และ Switch' },
  { sku: 'CT-004', name: 'Razer Wolverine V3 Pro', category: 'Controller', price: 6990, stock: 3, description: 'จอยสำหรับ Xbox/PC ปุ่ม Mecha-Tactile และ Trigger Stop' },
];
