'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';

interface Product {
  id: string; slug: string;
  name: string | Record<string, string>;
  basePrice: number; comparePrice?: number;
  avgRating: number; reviewCount: number;
  images: Array<{ url: string; altText?: string }>;
  brand?: { name: string };
  variants?: Array<{ stock: number }>;
  isDigital?: boolean; tags?: string[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const resolveName = (name: string | Record<string, string>, locale = 'pt'): string =>
  typeof name === 'string' ? name : (name[locale] ?? name['pt'] ?? Object.values(name)[0] ?? '');

export function ProductCard({ product, locale = 'pt' }: { product: Product; locale?: string }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [justAdded,  setJustAdded]  = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const name       = resolveName(product.name, locale);
  const stock      = product.variants?.reduce((a, v) => a + v.stock, 0) ?? 99;
  const outOfStock = stock === 0;
  const discount   = product.comparePrice && product.comparePrice > product.basePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock || justAdded) return;
    addItem({ productId: product.id, quantity: 1 });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1">
        <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
          {product.images[0] ? (
            <Image src={product.images[imageIndex]?.url ?? product.images[0].url}
              alt={name} fill sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
              style={{ transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.04)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
              loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-disabled)' }}>
              <ShoppingCart size={32} strokeWidth={1} />
            </div>
          )}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.slice(0, 5).map((_, i) => (
                <button key={i} onMouseEnter={e => { e.preventDefault(); setImageIndex(i); }}
                  className="rounded-full transition-all"
                  style={{ width: i === imageIndex ? 16 : 5, height: 5, background: i === imageIndex ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && <span className="badge badge-cyan" style={{ fontSize: 10 }}>−{discount}%</span>}
            {product.isDigital && <span className="badge badge-violet" style={{ fontSize: 10 }}>Digital</span>}
            {outOfStock && <span className="badge badge-muted" style={{ fontSize: 10 }}>Esgotado</span>}
          </div>
          <motion.button onClick={e => { e.preventDefault(); setWishlisted(v => !v); }} whileTap={{ scale: 0.85 }}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(9,9,11,0.75)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-default)' }}>
            <Heart size={14} style={{ fill: wishlisted ? '#f43f5e' : 'transparent', color: wishlisted ? '#f43f5e' : 'var(--text-secondary)', transition: 'fill 0.2s, color 0.2s' }} />
          </motion.button>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          {product.brand && (
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
              {product.brand.name}
            </p>
          )}
          <h3 className="text-sm font-medium line-clamp-2"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
            {name}
          </h3>
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={10} style={{ fill: s <= Math.round(product.avgRating) ? '#f59e0b' : 'transparent', color: s <= Math.round(product.avgRating) ? '#f59e0b' : 'var(--bg-muted)' }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{product.reviewCount}</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 mt-auto pt-1">
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {fmt(product.basePrice)}
            </span>
            {product.comparePrice && product.comparePrice > product.basePrice && (
              <span style={{ fontSize: 12, color: 'var(--text-disabled)', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.button key={justAdded ? 'added' : 'add'}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={handleAdd} disabled={outOfStock}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: justAdded ? 'rgba(34,197,94,0.08)' : 'transparent', border: `2px solid ${justAdded ? 'var(--accent-green)' : 'var(--border-default)'}`, color: justAdded ? 'var(--accent-green)' : 'var(--text-secondary)', boxShadow: justAdded ? '3px 3px 0 rgba(34,197,94,0.25)' : 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (justAdded || outOfStock) return; const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent-cyan)'; el.style.color = 'var(--accent-cyan)'; el.style.boxShadow = '3px 3px 0 rgba(0,212,255,0.2)'; el.style.transform = 'translate(-1px,-1px)'; }}
            onMouseLeave={e => { if (justAdded || outOfStock) return; const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-default)'; el.style.color = 'var(--text-secondary)'; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}>
            {justAdded ? <><Check size={14} /> Adicionado</> : outOfStock ? 'Esgotado' : <><ShoppingCart size={14} /> Adicionar</>}
          </motion.button>
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
