export type Role = 'customer' | 'admin';
export type OrderStatus = 'pending_payment' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  orderCount?: number;
}

export interface Category {
  id: number;
  name: string;
  productCount?: number;
}

export interface ProductImage {
  id: number;
  url: string;
  sortOrder: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  categoryId: number | null;
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  /** Cover image (the first gallery image). */
  imageUrl: string | null;
  /** Full gallery; only included on detail and admin endpoints. */
  images?: ProductImage[];
  /** Long-form content; only included on the product detail endpoints. */
  details?: string;
  highlights?: string[];
  specs?: ProductSpec[];
  isActive: boolean;
  category: Category | null;
  rating: { avg: number; count: number };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  available: boolean;
  product: Product;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  /** House number / moo / soi / road. */
  addressLine: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: string;
  amount: number;
  status: PaymentStatus;
  proofUrl: string | null;
  paidAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: { id: number; name: string; sku: string; imageUrl: string | null };
}

export interface Order {
  id: number;
  userId: number;
  orderDate: string;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingMethod: string;
  trackingNumber: string | null;
  shippingFee: number;
  items: OrderItem[];
  payments: Payment[];
  user: { id: number; fullName: string; email: string; phone: string | null };
  subtotal: number;
  total: number;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: number; fullName: string };
  product?: { id: number; name: string };
}

export interface OrderOptions {
  shippingMethods: Record<string, { label: string; fee: number }>;
  paymentMethods: Record<string, string>;
  freeShippingMin: number;
}
