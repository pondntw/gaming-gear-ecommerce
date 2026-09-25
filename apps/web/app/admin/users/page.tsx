'use client';

import { Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBox, PageTitle, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Role, User } from '@/lib/types';

export default function AdminUsersPage() {
  const { user: me, toast } = useStore();
  const [users, setUsers] = useState<User[] | null>(null);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get<User[]>('/admin/users', { q }).then(setUsers).catch((e) => setError(errorMessage(e)));
  }, [q]);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  if (error) return <ErrorBox message={error} />;

  return (
    <div>
      <PageTitle sub="จัดการบัญชีผู้ใช้และสิทธิ์">USERS</PageTitle>
      <form
        className="relative mb-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search.trim());
        }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input className="input pl-9" placeholder="ค้นหาชื่อหรืออีเมล แล้วกด Enter" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>
      {!users ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อ</th>
                <th>อีเมล</th>
                <th>เบอร์โทร</th>
                <th className="text-right">คำสั่งซื้อ</th>
                <th>สมัครเมื่อ</th>
                <th>สิทธิ์</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="text-muted">{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td className="text-muted">{u.phone ?? '-'}</td>
                  <td className="text-right">{u.orderCount}</td>
                  <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <select
                      className="input w-auto py-1"
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) =>
                        run(() => api.patch(`/admin/users/${u.id}`, { role: e.target.value as Role }), 'เปลี่ยนสิทธิ์แล้ว')
                      }
                    >
                      <option value="customer">ลูกค้า</option>
                      <option value="admin">ผู้ดูแลระบบ</option>
                    </select>
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button
                        className="btn-danger px-2 py-1"
                        title="ลบบัญชี"
                        onClick={() =>
                          confirm(`ลบบัญชี ${u.email}? คำสั่งซื้อและรีวิวของผู้ใช้นี้จะถูกลบด้วย`) &&
                          run(() => api.del(`/admin/users/${u.id}`), 'ลบบัญชีแล้ว')
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
