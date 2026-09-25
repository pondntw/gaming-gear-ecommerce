import { ReactNode } from 'react';

export function AuthCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="mx-auto mt-6 max-w-md">
      <div className="card p-8 shadow-[0_0_40px_-12px_rgb(255_43_214/0.45)]">
        <h1 className="neon-title text-center text-2xl">{title}</h1>
        {sub && <p className="mt-2 text-center text-sm text-muted">{sub}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** Only allow same-site relative redirects (blocks `//evil.com` and absolute URLs). */
export function safeNext(next: string | null, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
