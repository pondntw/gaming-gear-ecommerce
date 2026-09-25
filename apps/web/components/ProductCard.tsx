import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ProductImage, Stars } from './ui';

/** Label shown above the name, Apple "New"-style in orange. */
function stockLabel(p: Product) {
  if (p.stockQuantity === 0) return { text: 'สินค้าหมด', cls: 'text-muted' };
  if (p.stockQuantity <= 5) return { text: `เหลือเพียง ${p.stockQuantity} ชิ้น`, cls: 'text-warn' };
  return null;
}

export function ProductCard({ product, className = '' }: { product: Product; className?: string }) {
  const label = stockLabel(product);
  return (
    <Link href={`/products/${product.id}`} className={`card-hover group flex flex-col overflow-hidden ${className}`}>
      <div className="aspect-square overflow-hidden">
        <ProductImage
          src={product.imageUrl}
          category={product.category?.name}
          alt={product.name}
          className="transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-5 pb-5 pt-4">
        <span className={`h-4 text-xs font-medium ${label?.cls ?? ''}`}>{label?.text}</span>
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight">{product.name}</h3>
        {product.rating.count > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted">
            <Stars value={product.rating.avg} size={11} /> {product.rating.count}
          </span>
        )}
        <p className="mt-auto pt-3 text-[15px]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
