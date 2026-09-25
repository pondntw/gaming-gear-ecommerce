import { OrderStatus } from '@prisma/client';

export const FREE_SHIPPING_MIN = 3000;

export const SHIPPING_METHODS = {
  standard: { label: 'ส่งแบบธรรมดา (3-5 วัน)', fee: 50 },
  express: { label: 'ส่งด่วน (1-2 วัน)', fee: 100 },
} as const;
export type ShippingMethod = keyof typeof SHIPPING_METHODS;

export const PAYMENT_METHODS = {
  bank_transfer: 'โอนผ่านบัญชีธนาคาร',
  promptpay: 'พร้อมเพย์ (PromptPay)',
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

/** Standard shipping is free once the subtotal reaches FREE_SHIPPING_MIN; express always costs its fee. */
export function shippingFee(method: ShippingMethod, subtotal: number): number {
  if (method === 'standard' && subtotal >= FREE_SHIPPING_MIN) return 0;
  return SHIPPING_METHODS[method].fee;
}

/** Statuses a customer may still cancel from (before the shop starts packing). */
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ['pending_payment', 'payment_review'];

/** Manual status changes an admin can make. Payment approval/rejection has its own endpoints. */
export const ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  payment_review: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function orderTotals(order: {
  shippingFee: unknown;
  items: { unitPrice: unknown; quantity: number }[];
}) {
  const subtotal = order.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
  return { subtotal, total: subtotal + Number(order.shippingFee) };
}
