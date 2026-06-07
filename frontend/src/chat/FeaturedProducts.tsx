'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { api } from '@/lib/api';

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

export function FeaturedProducts() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8&status=ACTIVE')
      .then(r => setProducts(r.data.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section ref={ref} className="section" style={{ background: 'var(--bg-raised)' }}>
      <div className="divider-accent" />
      <div className="container">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="tag-label">Destaques</div>
            <h2 className="text-headline" style={{ color: 'var(--text-primary)' }}>
              Produtos em alta
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium"
            style={{ color: 'var(--text-tertiary)', transition: 'color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}
          >
            Ver catálogo <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
              ))
            : products.length > 0
              ? products.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))
              : (
                /* Placeholder cards when no data */
                Array.from({ length: 8 }).map((_, i) => (
                  <PlaceholderCard key={i} index={i} />
                ))
              )
          }
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-10"
        >
          <Link href="/shop">
            <button className="btn-ghost">
              Ver todos os produtos
              <ArrowRight size={15} />
            </button>
          </Link>
        </motion.div>
      </div>
      <div className="divider-accent" />
    </section>
  );
}

/* Skeleton placeholder with realistic shape */
function PlaceholderCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="skeleton aspect-square" />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
        <div className="skeleton h-5 w-1/2 rounded mt-1" />
      </div>
      <div className="px-4 pb-4">
        <div className="skeleton h-9 rounded-xl" />
      </div>
    </motion.div>
  );
}
