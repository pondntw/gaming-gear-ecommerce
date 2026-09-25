'use client';

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { useStore } from '@/lib/store';
import type { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
  const { toast } = useStore();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = () => api.get<Category[]>('/categories').then(setCategories).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      await load();
      return true;
    } catch (e) {
      toast(errorMessage(e), 'error');
      return false;
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.post('/admin/categories', { name: newName }), 'เพิ่มหมวดหมู่แล้ว')) setNewName('');
  };

  if (error) return <ErrorBox message={error} />;
  if (!categories) return <Spinner />;

  return (
    <div className="max-w-2xl">
      <PageTitle sub="จัดการหมวดหมู่สินค้า">CATEGORIES</PageTitle>
      <form onSubmit={create} className="mb-4 flex gap-2">
        <input className="input" placeholder="ชื่อหมวดหมู่ใหม่" required value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button className="btn-primary shrink-0"><Plus size={16} /> เพิ่ม</button>
      </form>
      <div className="card divide-y divide-line/60">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            {editId === c.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run(() => api.patch(`/admin/categories/${c.id}`, { name: editName }), 'แก้ไขหมวดหมู่แล้ว')) setEditId(null);
                }}
              >
                <input className="input" autoFocus required value={editName} onChange={(e) => setEditName(e.target.value)} />
                <button className="btn-cyan px-2" aria-label="บันทึก"><Check size={16} /></button>
                <button type="button" className="btn-ghost px-2" aria-label="ยกเลิก" onClick={() => setEditId(null)}><X size={16} /></button>
              </form>
            ) : (
              <>
                <span className="flex-1">{c.name}</span>
                <span className="text-sm text-muted">{c.productCount} สินค้า</span>
                <button className="btn-ghost px-2 py-1" title="แก้ไข" onClick={() => { setEditId(c.id); setEditName(c.name); }}>
                  <Pencil size={15} />
                </button>
                <button
                  className="btn-danger px-2 py-1"
                  title="ลบ"
                  onClick={() =>
                    confirm(`ลบหมวดหมู่ "${c.name}"? สินค้าในหมวดนี้จะกลายเป็น "ไม่ระบุหมวดหมู่"`) &&
                    run(() => api.del(`/admin/categories/${c.id}`), 'ลบหมวดหมู่แล้ว')
                  }
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="px-4 py-8 text-center text-muted">ยังไม่มีหมวดหมู่</p>}
      </div>
    </div>
  );
}
