'use client';

import {
  Armchair,
  Gamepad2,
  Headphones,
  Keyboard,
  Loader2,
  Monitor,
  Mouse,
  Package,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { ORDER_STATUS, PAYMENT_STATUS } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { OrderStatus, PaymentStatus, Role } from '@/lib/types';

// Soft tinted pills, Apple-style.
const TONES: Record<string, string> = {
  amber: 'bg-[#fff4e5] text-warn',
  violet: 'bg-[#f3eefe] text-[#6e3ad6]',
  cyan: 'bg-[#e8f2fd] text-accent',
  blue: 'bg-[#e8f2fd] text-accent',
  green: 'bg-[#e6f4ea] text-success',
  red: 'bg-[#fde8e8] text-danger',
  slate: 'bg-surface text-muted',
};

export function Badge({ tone = 'slate', children }: { tone?: string; children: ReactNode }) {
  return <span className={`badge ${TONES[tone] ?? TONES.slate}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-[#ff9f0a] text-[#ff9f0a]' : 'fill-surface-2 text-surface-2'}
        />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="ให้คะแนน">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          type="button"
          key={i}
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} ดาว`}
          onClick={() => onChange(i)}
          className="transition hover:scale-110"
        >
          <Star size={28} className={i <= value ? 'fill-[#ff9f0a] text-[#ff9f0a]' : 'fill-surface-2 text-surface-2'} />
        </button>
      ))}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Mouse,
  Keyboard,
  Headset: Headphones,
  Monitor,
  Chair: Armchair,
  Controller: Gamepad2,
};

export function categoryIcon(name?: string | null): LucideIcon {
  return (name && CATEGORY_ICONS[name]) || Package;
}

/** Product photo, or a quiet category icon when there is no image. */
export function ProductImage({
  src,
  category,
  alt,
  className = '',
}: {
  src: string | null;
  category?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} />;
  }
  const Icon = categoryIcon(category);
  return (
    <div className={`flex h-full w-full items-center justify-center bg-surface ${className}`}>
      <Icon className="h-1/3 w-1/3 text-[#aeaeb2]" strokeWidth={1.2} />
    </div>
  );
}

export function Spinner({ label = 'กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted">
      <Loader2 className="animate-spin" size={20} /> {label}
    </div>
  );
}

export function Empty({ icon: Icon = Package, title, children }: { icon?: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <Icon size={44} className="text-[#aeaeb2]" strokeWidth={1.2} />
      <p className="text-xl font-semibold">{title}</p>
      {children}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-xl bg-[#fde8e8] px-4 py-3 text-sm text-danger">{message}</div>;
}

export function PageTitle({ children, sub, action }: { children: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="headline">{children}</h1>
        {sub && <p className="mt-2 text-lg text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** Renders children only for logged-in users (optionally with a role); redirects otherwise. */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, ready } = useStore();
  const router = useRouter();
  const allowed = !!user && (!role || user.role === role);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    else if (role && user.role !== role) router.replace('/');
  }, [ready, user, role, router]);

  return allowed ? <>{children}</> : <Spinner />;
}
