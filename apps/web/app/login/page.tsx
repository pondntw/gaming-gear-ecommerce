'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AuthCard, safeNext } from '@/components/AuthCard';
import { ErrorBox, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { User } from '@/lib/types';

function LoginForm() {
  const { login, toast } = useStore();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post<{ accessToken: string; user: User }>('/auth/login', { email, password });
      login(res.accessToken, res.user);
      toast(`ยินดีต้อนรับ ${res.user.fullName}`);
      router.push(safeNext(next, res.user.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="เข้าสู่ระบบ" sub="ใช้บัญชี Gaming Gear ของคุณ">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div>
          <label className="label" htmlFor="email">อีเมล</label>
          <input id="email" type="email" className="input" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex justify-between">
            <label className="label" htmlFor="password">รหัสผ่าน</label>
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">ลืมรหัสผ่าน?</Link>
          </div>
          <input id="password" type="password" className="input" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
        <p className="text-center text-sm text-muted">
          ยังไม่มีบัญชี?{' '}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-accent hover:underline">สมัครสมาชิก</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}
