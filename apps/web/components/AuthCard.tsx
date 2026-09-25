import { ReactNode } from 'react';
import { LogoMark } from './Navbar';

export function AuthCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[440px] py-4">
      <div className="card px-8 py-10 sm:px-10">
        <LogoMark className="mx-auto h-9 w-9 text-ink" />
        <h1 className="mt-5 text-center text-[28px] font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-center text-muted">{sub}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

/** Only allow same-site relative redirects (blocks `//evil.com` and absolute URLs). */
export function safeNext(next: string | null, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
