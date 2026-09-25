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

const TONES: Record<string, string> = {
  amber: 'border-amber-400/50 bg-amber-400/10 text-amber-200',
  violet: 'border-violet-400/50 bg-violet-400/10 text-violet-200',
  cyan: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200',
  blue: 'border-blue-400/50 bg-blue-400/10 text-blue-200',
  green: 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200',
  red: 'border-red-400/50 bg-red-400/10 text-red-200',
  slate: 'border-slate-500/50 bg-slate-500/10 text-slate-300',
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
          className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
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
        >
          <Star size={26} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-amber-300'} />
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

/** Product photo, or a neon icon placeholder based on category when there is no image. */
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
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1b1440] via-[#0d1230] to-[#081a2e] ${className}`}
    >
      <Icon className="h-1/3 w-1/3 text-neon-cyan drop-shadow-[0_0_12px_rgb(34_227_255/0.8)]" strokeWidth={1.3} />
    </div>
  );
}

export function Spinner({ label = 'กำลังโหลด...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <Loader2 className="animate-spin" size={20} /> {label}
    </div>
  );
}

export function Empty({ icon: Icon = Package, title, children }: { icon?: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Icon size={40} className="text-neon-violet" strokeWidth={1.4} />
      <p className="text-lg">{title}</p>
      {children}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">{message}</div>;
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="neon-title text-2xl sm:text-3xl">{children}</h1>
      {sub && <p className="mt-1 text-muted">{sub}</p>}
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
