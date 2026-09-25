'use client';

import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { AddressForm, AddressInput } from '@/components/AddressForm';
import { PageTitle, RequireAuth, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { Address, User } from '@/lib/types';

function ProfileSection() {
  const { user, setUser, toast } = useStore();
  const [fullName, setFullName] = useState(user!.fullName);
  const [phone, setPhone] = useState(user!.phone ?? '');
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setUser(await api.patch<User>('/me/profile', { fullName, phone }));
      toast('บันทึกข้อมูลส่วนตัวแล้ว');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <h2 className="font-medium">ข้อมูลส่วนตัว</h2>
      <div>
        <label className="label">อีเมล</label>
        <input className="input opacity-60" value={user!.email} disabled />
      </div>
      <div>
        <label className="label" htmlFor="fullName">ชื่อ-นามสกุล</label>
        <input id="fullName" className="input" required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="phone">เบอร์โทรศัพท์</label>
        <input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button className="btn-primary" disabled={busy}>บันทึก</button>
    </form>
  );
}

function PasswordSection() {
  const { toast } = useStore();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', 'error');
    setBusy(true);
    try {
      await api.post('/me/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast('เปลี่ยนรหัสผ่านแล้ว');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="card space-y-3 p-5">
      <h2 className="font-medium">เปลี่ยนรหัสผ่าน</h2>
      <div>
        <label className="label" htmlFor="cur">รหัสผ่านปัจจุบัน</label>
        <input id="cur" type="password" className="input" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="new">รหัสผ่านใหม่</label>
        <input id="new" type="password" className="input" required minLength={6} value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label>
        <input id="confirm" type="password" className="input" required minLength={6} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
      </div>
      <button className="btn-primary" disabled={busy}>เปลี่ยนรหัสผ่าน</button>
    </form>
  );
}

function AddressSection() {
  const { toast } = useStore();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);

  const load = () => api.get<Address[]>('/me/addresses').then(setAddresses);
  useEffect(() => {
    load().catch(() => setAddresses([]));
  }, []);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      await load();
      setEditing(null);
      toast(msg);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  if (!addresses) return <Spinner />;

  return (
    <section className="card space-y-3 p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">ที่อยู่จัดส่ง</h2>
        {editing !== 'new' && (
          <button className="btn-cyan py-1.5" onClick={() => setEditing('new')}>
            <Plus size={16} /> เพิ่มที่อยู่
          </button>
        )}
      </div>
      {editing === 'new' && (
        <div className="rounded-lg border border-line p-4">
          <AddressForm
            initial={{ isDefault: addresses.length === 0 }}
            onCancel={() => setEditing(null)}
            onSubmit={(a: AddressInput) => run(() => api.post('/me/addresses', a), 'เพิ่มที่อยู่แล้ว')}
          />
        </div>
      )}
      {addresses.length === 0 && editing !== 'new' && <p className="text-sm text-muted">ยังไม่มีที่อยู่ที่บันทึกไว้</p>}
      {addresses.map((a) =>
        editing === a.id ? (
          <div key={a.id} className="rounded-lg border border-neon-cyan/50 p-4">
            <AddressForm
              initial={a}
              onCancel={() => setEditing(null)}
              onSubmit={(input) => run(() => api.patch(`/me/addresses/${a.id}`, input), 'แก้ไขที่อยู่แล้ว')}
            />
          </div>
        ) : (
          <div key={a.id} className="flex flex-wrap items-start gap-3 rounded-lg border border-line p-4 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {a.recipientName} · {a.phone}
                {a.isDefault && <span className="ml-2 text-xs text-neon-cyan">ที่อยู่หลัก</span>}
              </p>
              <p className="text-muted">{a.addressLine}</p>
            </div>
            <div className="flex gap-1">
              {!a.isDefault && (
                <button
                  className="btn-ghost px-2 py-1"
                  title="ตั้งเป็นที่อยู่หลัก"
                  onClick={() => run(() => api.patch(`/me/addresses/${a.id}`, { isDefault: true }), 'ตั้งเป็นที่อยู่หลักแล้ว')}
                >
                  <Star size={15} />
                </button>
              )}
              <button className="btn-ghost px-2 py-1" title="แก้ไข" onClick={() => setEditing(a.id)}>
                <Pencil size={15} />
              </button>
              <button
                className="btn-danger px-2 py-1"
                title="ลบ"
                onClick={() => confirm('ลบที่อยู่นี้?') && run(() => api.del(`/me/addresses/${a.id}`), 'ลบที่อยู่แล้ว')}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ),
      )}
    </section>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <PageTitle sub="จัดการข้อมูลส่วนตัว รหัสผ่าน และที่อยู่จัดส่ง">MY ACCOUNT</PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileSection />
        <PasswordSection />
        <AddressSection />
      </div>
    </RequireAuth>
  );
}
