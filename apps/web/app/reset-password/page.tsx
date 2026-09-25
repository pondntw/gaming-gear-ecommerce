'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { ErrorBox, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="RESET PASSWORD">
        <ErrorBox message="ลิงก์ไม่ถูกต้อง กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่" />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="NEW PASSWORD" sub="ตั้งรหัสผ่านใหม่ของคุณ">
      {done ? (
        <div className="space-y-4 text-center">
          <p>ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</p>
          <Link href="/login" className="btn-primary">เข้าสู่ระบบ</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          <div>
            <label className="label" htmlFor="password">รหัสผ่านใหม่</label>
            <input id="password" type="password" className="input" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label>
            <input id="confirm" type="password" className="input" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button className="btn-primary w-full py-2.5" disabled={busy}>บันทึกรหัสผ่านใหม่</button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ResetForm />
    </Suspense>
  );
}
