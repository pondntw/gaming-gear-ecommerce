'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AuthCard, safeNext } from '@/components/AuthCard';
import { ErrorBox, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { User } from '@/lib/types';

function RegisterForm() {
  const { login, toast } = useStore();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    setBusy(true);
    setError('');
    try {
      const { confirm: _confirm, ...body } = form;
      const res = await api.post<{ accessToken: string; user: User }>('/auth/register', {
        ...body,
        phone: body.phone || undefined,
      });
      login(res.accessToken, res.user);
      toast('สมัครสมาชิกสำเร็จ!');
      router.push(safeNext(next));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="สร้างบัญชี" sub="บัญชีเดียว ใช้ได้ทั้งร้าน">
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <div>
          <label className="label" htmlFor="fullName">ชื่อ-นามสกุล</label>
          <input id="fullName" className="input" required minLength={2} value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="label" htmlFor="email">อีเมล</label>
          <input id="email" type="email" className="input" required autoComplete="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label" htmlFor="phone">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
          <input id="phone" type="tel" className="input" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">รหัสผ่าน</label>
            <input id="password" type="password" className="input" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">ยืนยันรหัสผ่าน</label>
            <input id="confirm" type="password" className="input" required minLength={6} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
        <p className="text-center text-sm text-muted">
          มีบัญชีอยู่แล้ว? <Link href="/login" className="text-accent hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterForm />
    </Suspense>
  );
}
