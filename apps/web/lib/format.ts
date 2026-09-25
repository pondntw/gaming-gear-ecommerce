import type { OrderStatus } from './types';

const baht = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });

export const formatPrice = (n: number) => baht.format(n);

export const formatDate = (s: string) =>
  new Date(s).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending_payment: { label: 'รอชำระเงิน', tone: 'amber' },
  payment_review: { label: 'รอตรวจสอบการชำระ', tone: 'violet' },
  processing: { label: 'กำลังเตรียมสินค้า', tone: 'cyan' },
  shipped: { label: 'จัดส่งแล้ว', tone: 'blue' },
  delivered: { label: 'ได้รับสินค้าแล้ว', tone: 'green' },
  cancelled: { label: 'ยกเลิกแล้ว', tone: 'red' },
};

export const STATUS_FLOW: OrderStatus[] = ['pending_payment', 'payment_review', 'processing', 'shipped', 'delivered'];

export const PAYMENT_STATUS = {
  pending: { label: 'รอตรวจสอบ', tone: 'violet' },
  approved: { label: 'อนุมัติแล้ว', tone: 'green' },
  rejected: { label: 'ไม่ผ่าน', tone: 'red' },
} as const;
