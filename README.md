# Gaming Gear E-Commerce — CSC481 ดุ๋มดึ๋ย GROUP

ระบบร้านจำหน่ายอุปกรณ์ Gaming Gear ตามเอกสารโครงการ (`481 ดุ๋มดึ๋ย.pdf`)

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 — `apps/web` |
| Backend | NestJS 11 + Prisma 6 (REST API ที่ `/api`) — `apps/api` |
| Database / Storage | Supabase (PostgreSQL + Storage) |
| Deployment | Vercel (web และ api แยกกันเป็น 2 โปรเจกต์) |

## ฟีเจอร์ (ตาม FDD)

1. **บัญชีผู้ใช้**: สมัครสมาชิก เข้าสู่ระบบ/ออกจากระบบ รีเซ็ตรหัสผ่าน จัดการข้อมูลส่วนตัวและที่อยู่ ส่วนแอดมินจัดการบัญชีและสิทธิ์ผู้ใช้ได้
2. **รายการสินค้า**: ค้นหา กรองตามหมวด ราคา และสต็อก เรียงลำดับ ดูรายละเอียดและจำนวนคงเหลือ ส่วนแอดมินเพิ่ม แก้ไข ลบ (soft delete) สินค้า อัปโหลดรูป จัดการหมวดหมู่ และปรับสต็อก
3. **ตะกร้าและการสั่งซื้อ**: เพิ่ม ลบ และปรับจำนวนในตะกร้า เลือกที่อยู่และวิธีจัดส่ง ดูสรุปคำสั่งซื้อ แล้วชำระเงินพร้อมแนบสลิป
4. **คำสั่งซื้อและการจัดส่ง**: ลูกค้าดูประวัติ ติดตามสถานะ และยกเลิกคำสั่งซื้อได้ ส่วนแอดมินตรวจสลิป (อนุมัติหรือปฏิเสธ) อัปเดตสถานะ และใส่เลขพัสดุ
5. **รีวิว**: ลูกค้ารีวิวได้เฉพาะสินค้าที่ได้รับแล้ว เพิ่ม แก้ไข และลบรีวิวของตัวเองได้ ส่วนแอดมินตรวจสอบและลบรีวิวได้

สถานะคำสั่งซื้อ: `รอชำระเงิน → รอตรวจสอบการชำระ → กำลังเตรียมสินค้า → จัดส่งแล้ว → ได้รับสินค้าแล้ว` หรือ `ยกเลิก` (ระบบคืนสต็อกให้อัตโนมัติ)

ค่าจัดส่ง: ส่งธรรมดา 50 บาท (ฟรีเมื่อซื้อครบ 3,000 บาท) และส่งด่วน 100 บาท

## การติดตั้งครั้งแรก

ต้องมี Node.js 20 ขึ้นไป และโปรเจกต์ Supabase

1. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```
2. **สร้างฐานข้อมูล**: เปิด Supabase → SQL Editor แล้วรันไฟล์ [`supabase/schema.sql`](supabase/schema.sql) ทั้งไฟล์ ไฟล์นี้จะสร้างตาราง ข้อมูลตัวอย่าง (6 หมวด, 20 สินค้า, บัญชีแอดมิน) และ Storage bucket 2 อัน
   - ทางเลือก: ใส่ `.env` ตามข้อ 3 ก่อน แล้วรัน `npm run db:push && npm run db:seed` (วิธีนี้ไม่สร้าง bucket ให้ ต้องสร้างเองใน Supabase → Storage: `product-images` แบบ public และ `payment-slips` แบบ private)
3. **ตั้งค่า environment**: ดูตัวอย่างใน [`.env.example`](.env.example)
   - `apps/api/.env`: `DATABASE_URL`, `DIRECT_URL` (Supabase → Connect), `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API), `WEB_ORIGIN`
   - `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
4. **รันทั้งสองแอป**
   ```bash
   npm run dev
   ```
   - เว็บ: http://localhost:3000
   - API: http://localhost:4000/api

**บัญชีแอดมินตัวอย่าง:** `admin@gaminggear.local` / `admin1234` (ควรเปลี่ยนรหัสผ่านหลังเข้าใช้ครั้งแรก)

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | รัน web และ api พร้อมกัน |
| `npm run build` | build ทั้งสองแอป |
| `npm test` | unit test ของ backend (Jest) |
| `npm run gen:sql -w apps/api` | สร้าง `supabase/schema.sql` ใหม่จาก Prisma schema หลังแก้ schema |

## Deploy บน Vercel

สร้าง 2 โปรเจกต์จาก repo เดียวกัน:

- **API**: Root Directory เป็น `apps/api` ซึ่งมี `vercel.json` และ `api/index.js` เตรียมไว้แล้ว ใส่ env ทั้งหมดของ api และตั้ง `WEB_ORIGIN` เป็น URL ของเว็บ (ใส่หลายค่าได้โดยคั่นด้วย `,`)
- **Web**: Root Directory เป็น `apps/web` (Framework: Next.js) และตั้ง `NEXT_PUBLIC_API_URL=https://<api-domain>/api`

## ส่วนที่ต่างจาก ERD ในสไลด์

- เพิ่มตาราง `addresses` (สำหรับจัดการที่อยู่หลายรายการ) และ `password_reset_tokens` (สำหรับรีเซ็ตรหัสผ่าน)
- `cart_items` ห้ามมีสินค้าซ้ำในตะกร้าเดียวกัน และ `reviews` ให้ผู้ใช้รีวิวสินค้าหนึ่งได้ครั้งเดียว (แก้ไขได้)
- สลิปการชำระเงินเก็บใน bucket แบบ private ระบบสร้างลิงก์ชั่วคราว (1 ชั่วโมง) ทุกครั้งที่เปิดดู
- เปิด Row Level Security ทุกตาราง เพื่อไม่ให้ใครอ่านข้อมูลผ่าน Supabase REST API ด้วย anon key ได้ แอปเข้าถึงข้อมูลผ่าน NestJS เท่านั้น
- ยังไม่มีระบบส่งอีเมล ลิงก์รีเซ็ตรหัสผ่านจะแสดงบนหน้าเว็บ (เฉพาะตอนที่ไม่ใช่ production) และพิมพ์ไว้ใน log ของ API
- เลขบัญชีธนาคารและพร้อมเพย์บนหน้าชำระเงินเป็นข้อมูลตัวอย่าง แก้ได้ที่ `BANK_INFO` ใน `apps/web/app/orders/[id]/page.tsx`

## โครงสร้างโปรเจกต์

```
apps/api/
  prisma/schema.prisma      โครงสร้างฐานข้อมูล (ตาม ERD)
  prisma/seed*.ts           ข้อมูลตัวอย่าง
  src/auth                  สมัคร / login / JWT / รีเซ็ตรหัส
  src/users                 โปรไฟล์ ที่อยู่ และการจัดการผู้ใช้ของแอดมิน
  src/products, categories  สินค้า หมวดหมู่ สต็อก อัปโหลดรูป
  src/cart                  ตะกร้า
  src/orders                checkout ชำระเงิน สถานะ (กติกาอยู่ใน order-rules.ts)
  src/reviews               รีวิว
  src/admin                 สถิติบนหน้า dashboard
apps/web/
  app/                      หน้าเว็บทั้งหมด (หน้าแอดมินอยู่ใน app/admin)
  components/, lib/         UI ที่ใช้ร่วมกัน, API client, state
supabase/schema.sql         SQL สำหรับรันใน Supabase
```
