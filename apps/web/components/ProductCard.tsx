import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductImage, Stars } from './ui';

export function ProductCard({ product }: { product: Product }) {
  const out = product.stockQuantity === 0;
  return (
    <Link href={`/products/${product.id}`} className="card-glow group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          category={product.category?.name}
          alt={product.name}
          className="transition duration-300 group-hover:scale-105"
        />
        {out && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-red-300">สินค้าหมด</span>
        )}
        {!out && product.stockQuantity <= 5 && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs text-amber-300">
            เหลือ {product.stockQuantity} ชิ้น
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wider text-neon-cyan/80">{product.category?.name ?? 'อื่นๆ'}</span>
        <h3 className="line-clamp-2 font-medium leading-snug">{product.name}</h3>
        <div className="flex items-center gap-1 text-xs text-muted">
          <Stars value={product.rating.avg} size={12} />
          <span>({product.rating.count})</span>
        </div>
        <p className="mt-auto pt-2 text-lg font-semibold text-neon-pink">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
