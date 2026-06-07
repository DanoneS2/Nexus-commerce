'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Cpu, Smartphone, Monitor, Shirt, Gamepad2,
  Watch, Home, Download, Headphones, Zap,
} from 'lucide-react';

const CATEGORIES = [
  { slug: 'electronics',  name: 'Eletrônicos',      icon: Cpu,         count: '2.4k' },
  { slug: 'smartphones',  name: 'Smartphones',       icon: Smartphone,  count: '890' },
  { slug: 'computers',    name: 'Computadores',      icon: Monitor,     count: '1.1k' },
  { slug: 'fashion',      name: 'Moda',              icon: Shirt,       count: '5.2k' },
  { slug: 'games',        name: 'Games',             icon: Gamepad2,    count: '3.8k' },
  { slug: 'accessories',  name: 'Acessórios',        icon: Watch,       count: '4.1k' },
  { slug: 'home',         name: 'Casa',              icon: Home,        count: '2.9k' },
  { slug: 'digital',      name: 'Digitais',          icon: Download,    count: '670' },
  { slug: 'audio',        name: 'Áudio',             icon: Headphones,  count: '1.3k' },
  { slug: 'tech',         name: 'Tecnologia',        icon: Zap,         count: '980' },
];

export function CategoriesSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="section" style={{ background: 'var(--bg-base)' }}>
      <div className="container">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between mb-10"
        >
          <div>
            <div className="tag-label">Categorias</div>
            <h2 className="text-headline" style={{ color: 'var(--text-primary)' }}>
              Encontre o que procura
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-sm font-medium hidden sm:flex items-center gap-1.5"
            style={{ color: 'var(--text-tertiary)', transition: 'color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}
          >
            Ver todos →
          </Link>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          {CATEGORIES.map(cat => (
            <motion.div
              key={cat.slug}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show:   { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <Link href={`/shop?category=${cat.slug}`}>
                <div
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl text-center"
                  style={{
                    background:  'var(--bg-raised)',
                    border:      '1px solid var(--border-subtle)',
                    transition:  'border-color 0.2s, background 0.2s, transform 0.2s',
                    cursor:      'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border-default)';
                    el.style.background  = 'var(--bg-overlay)';
                    el.style.transform   = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'var(--border-subtle)';
                    el.style.background  = 'var(--bg-raised)';
                    el.style.transform   = 'none';
                  }}
                >
                  {/* Icon box */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:  'rgba(0,212,255,0.07)',
                      border:      '1px solid rgba(0,212,255,0.12)',
                      transition:  'background 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <cat.icon
                      size={18}
                      style={{ color: 'var(--accent-cyan)', transition: 'color 0.2s' }}
                    />
                  </div>

                  {/* Text */}
                  <div>
                    <p
                      style={{
                        fontSize:      13,
                        fontWeight:    600,
                        letterSpacing: '-0.01em',
                        color:         'var(--text-primary)',
                        lineHeight:    1.3,
                      }}
                    >
                      {cat.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 3 }}>
                      {cat.count} itens
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
