'use client';

import { Boxes, Images, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { GalleryEditor } from '@/components/GalleryEditor';
import { Modal } from '@/components/Modal';
import { Badge, ErrorBox, PageTitle, ProductImage, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Category, Paged, Product } from '@/lib/types';

type FormState = {
  sku: string;
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  images: string[];
  isActive: boolean;
};

const EMPTY: FormState = { sku: '', name: '', description: '', price: '', stockQuantity: '0', categoryId: '', images: [], isActive: true };

function ProductForm({
  product,
  categories,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const { toast } = useStore();
  const [form, setForm] = useState<FormState>(
    product
      ? {
          sku: product.sku,
          name: product.name,
          description: product.description,
          price: String(product.price),
          stockQuantity: String(product.stockQuantity),
          categoryId: product.categoryId ? String(product.categoryId) : '',
          // Older products may only have a cover and no gallery rows yet.
          images: product.images?.length ? product.images.map((i) => i.url) : product.imageUrl ? [product.imageUrl] : [],
          isActive: product.isActive,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      images: form.images,
      isActive: form.isActive,
    };
    try {
      if (product) await api.patch(`/admin/products/${product.id}`, body);
      else await api.post('/admin/products', body);
      toast(product ? 'บันทึกสินค้าแล้ว' : 'เพิ่มสินค้าแล้ว');
      onSaved();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <GalleryEditor
        images={form.images}
        onChange={(images) => setForm((f) => ({ ...f, images }))}
        category={categories.find((c) => String(c.id) === form.categoryId)?.name}
        onUploadingChange={setUploading}
      />
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <div>
            <label className="label" htmlFor="sku">SKU</label>
            <input id="sku" className="input uppercase" required value={form.sku} onChange={set('sku')} />
          </div>
          <div>
            <label className="label" htmlFor="name">ชื่อสินค้า</label>
            <input id="name" className="input" required value={form.name} onChange={set('name')} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">ราคา (บาท)</label>
            <input id="price" type="number" min={0} step="0.01" className="input" required value={form.price} onChange={set('price')} />
          </div>
          <div>
            <label className="label" htmlFor="stock">สต็อก</label>
            <input id="stock" type="number" min={0} className="input" required value={form.stockQuantity} onChange={set('stockQuantity')} />
          </div>
          <div>
            <label className="label" htmlFor="cat">หมวดหมู่</label>
            <select id="cat" className="input" value={form.categoryId} onChange={set('categoryId')}>
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="desc">รายละเอียด</label>
          <textarea id="desc" className="input min-h-24" value={form.description} onChange={set('description')} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[#22e3ff]" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          วางขาย (แสดงหน้าร้าน)
        </label>
        <button className="btn-primary" disabled={busy || uploading}>{product ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</button>
      </div>
    </form>
  );
}

function StockForm({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const { toast } = useStore();
  const [mode, setMode] = useState<'delta' | 'set'>('delta');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/admin/products/${product.id}/stock`, { [mode]: Number(value) });
      toast('ปรับสต็อกแล้ว');
      onSaved();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm">
        {product.name} — คงเหลือปัจจุบัน <span className="font-semibold text-neon-cyan">{product.stockQuantity}</span> ชิ้น
      </p>
      <div className="flex gap-2 text-sm">
        <button type="button" className={mode === 'delta' ? 'btn-cyan' : 'btn-ghost'} onClick={() => setMode('delta')}>
          รับเข้า / ตัดออก
        </button>
        <button type="button" className={mode === 'set' ? 'btn-cyan' : 'btn-ghost'} onClick={() => setMode('set')}>
          กำหนดจำนวนใหม่
        </button>
      </div>
      <div>
        <label className="label" htmlFor="stockValue">
          {mode === 'delta' ? 'จำนวนที่ปรับ (ใส่ค่าลบเพื่อตัดสต็อก เช่น -2)' : 'จำนวนคงเหลือใหม่'}
        </label>
        <input id="stockValue" type="number" className="input" required min={mode === 'set' ? 0 : undefined} value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="btn-primary" disabled={busy || value === ''}>บันทึก</button>
    </form>
  );
}

export default function AdminProductsPage() {
  const { toast } = useStore();
  const [data, setData] = useState<Paged<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [stocking, setStocking] = useState<Product | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get<Paged<Product>>('/admin/products', { q, status, categoryId, page, pageSize: 20, sort: 'newest' })
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [q, status, categoryId, page]);

  useEffect(load, [load]);
  useEffect(() => {
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }, []);

  const toggleActive = async (p: Product) => {
    if (p.isActive && !confirm(`ลบ "${p.name}" ออกจากหน้าร้าน? (ข้อมูลในคำสั่งซื้อเดิมจะยังอยู่)`)) return;
    try {
      if (p.isActive) await api.del(`/admin/products/${p.id}`);
      else await api.patch(`/admin/products/${p.id}`, { isActive: true });
      toast(p.isActive ? 'ลบสินค้าออกจากหน้าร้านแล้ว' : 'นำสินค้ากลับมาขายแล้ว');
      load();
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle sub="เพิ่ม แก้ไข ลบสินค้า และจัดการสต็อก">PRODUCTS</PageTitle>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> เพิ่มสินค้า
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <form
          className="relative min-w-60 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input className="input pl-9" placeholder="ค้นหาชื่อ / SKU แล้วกด Enter" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
        <select className="input w-auto" value={categoryId} onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}>
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="all">ทุกสถานะ</option>
          <option value="active">วางขาย</option>
          <option value="inactive">ถูกลบ/ซ่อน</option>
        </select>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !data ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>หมวดหมู่</th>
                <th className="text-right">ราคา</th>
                <th className="text-right">สต็อก</th>
                <th>สถานะ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className={p.isActive ? '' : 'opacity-50'}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                        <ProductImage src={p.imageUrl} category={p.category?.name} alt={p.name} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{p.name}</p>
                        <p className="flex items-center gap-2 text-xs text-muted">
                          {p.sku}
                          <span className="inline-flex items-center gap-0.5" title="จำนวนรูป">
                            <Images size={12} /> {p.images?.length ?? 0}
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{p.category?.name ?? '-'}</td>
                  <td className="text-right">{formatPrice(p.price)}</td>
                  <td className={`text-right ${p.stockQuantity === 0 ? 'text-red-300' : p.stockQuantity < 5 ? 'text-amber-300' : ''}`}>
                    {p.stockQuantity}
                  </td>
                  <td>{p.isActive ? <Badge tone="green">วางขาย</Badge> : <Badge>ซ่อน</Badge>}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button className="btn-ghost px-2 py-1" title="ปรับสต็อก" onClick={() => setStocking(p)}>
                        <Boxes size={15} />
                      </button>
                      <button className="btn-ghost px-2 py-1" title="แก้ไข" onClick={() => setEditing(p)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        className={p.isActive ? 'btn-danger px-2 py-1' : 'btn-cyan px-2 py-1'}
                        title={p.isActive ? 'ลบ' : 'นำกลับมาขาย'}
                        onClick={() => toggleActive(p)}
                      >
                        {p.isActive ? <Trash2 size={15} /> : <RotateCcw size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted">ไม่พบสินค้า</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} className={n === page ? 'btn-primary' : 'btn-ghost'} onClick={() => setPage(n)}>{n}</button>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'} onClose={() => setEditing(null)}>
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        </Modal>
      )}
      {stocking && (
        <Modal title="ปรับสต็อกสินค้า" onClose={() => setStocking(null)}>
          <StockForm
            product={stocking}
            onSaved={() => {
              setStocking(null);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
