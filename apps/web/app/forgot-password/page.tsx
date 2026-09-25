'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { ErrorBox } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ message: string; resetUrl?: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setResult(await api.post('/auth/forgot-password', { email }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="RESET PASSWORD" sub="กรอกอีเมลที่ใช้สมัครสมาชิก">
      {result ? (
        <div className="space-y-4 text-center">
          <p>{result.message}</p>
          {result.resetUrl && (
            <div className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-3 text-left text-sm">
              <p className="mb-1 text-amber-200">โหมดทดสอบ (ยังไม่ได้เชื่อมระบบอีเมล):</p>
              <a href={result.resetUrl} className="break-all text-neon-cyan underline">
                {result.resetUrl}
              </a>
            </div>
          )}
          <Link href="/login" className="btn-ghost">กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBox message={error} />}
          <div>
            <label className="label" htmlFor="email">อีเมล</label>
            <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full py-2.5" disabled={busy}>ส่งลิงก์รีเซ็ตรหัสผ่าน</button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-neon-cyan hover:underline">กลับไปหน้าเข้าสู่ระบบ</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
