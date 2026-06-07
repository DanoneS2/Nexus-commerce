'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, Globe, TrendingUp, Lock, Cpu } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
};
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } };

const STATS = [
  { value: '50k+',  label: 'Produtos' },
  { value: '120k+', label: 'Clientes' },
  { value: '99.9%', label: 'Uptime' },
];
const LOGOS = ['Stripe', 'Linear', 'Vercel', 'Notion', 'Figma'];
const FEATURES = [
  { icon: Zap,        title: 'Performance extrema',  desc: 'CDN global com carregamento em < 100ms.',  accent: 'var(--accent-cyan)' },
  { icon: Shield,     title: 'Segurança enterprise',  desc: 'Criptografia ponta a ponta, 2FA e RBAC.',  accent: 'var(--accent-violet)' },
  { icon: Globe,      title: 'Escala global',         desc: 'Multi-região, 6 idiomas, multi-moeda.',    accent: 'var(--accent-cyan)' },
  { icon: TrendingUp, title: 'Analytics avançado',   desc: 'Dashboards em tempo real e insights.',      accent: 'var(--accent-violet)' },
  { icon: Lock,       title: 'Compliance total',      desc: 'LGPD, PCI DSS e SOC 2 prontos.',           accent: 'var(--accent-cyan)' },
  { icon: Cpu,        title: 'API-first',             desc: 'REST + webhooks. Integre em minutos.',      accent: 'var(--accent-violet)' },
];

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const heroOp = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const orbY   = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);

  return (
    <main style={{ background: 'var(--bg-base)' }}>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-grid noise">
        <motion.div style={{ y: orbY }} aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(0,212,255,0.07) 0%, transparent 65%)', filter: 'blur(2px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 65%)' }} />
        </motion.div>

        <motion.div style={{ y: heroY, opacity: heroOp }} className="relative z-10 container">
          <motion.div variants={STAGGER} initial="hidden" animate="show"
            className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            <motion.div variants={FADE_UP}>
              <span className="badge badge-cyan"><Sparkles size={10} /> Plataforma de próxima geração</span>
            </motion.div>

            <motion.h1 variants={FADE_UP}
              style={{ fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.06, color: 'var(--text-primary)' }}>
              O comércio{' '}
              <span style={{ background: 'linear-gradient(90deg, var(--accent-cyan) 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                reimaginado
              </span>
              <br />para empresas.
            </motion.h1>

            <motion.p variants={FADE_UP} style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 440 }}>
              Infraestrutura de e-commerce enterprise — rápida, segura e que escala com o seu negócio.
            </motion.p>

            <motion.div variants={FADE_UP} className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/shop"><button className="btn-primary">Explorar loja <ArrowRight size={15} /></button></Link>
              <Link href="/register"><button className="btn-ghost">Criar conta grátis</button></Link>
            </motion.div>

            <motion.div variants={FADE_UP} className="flex flex-col items-center gap-3 pt-2">
              <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Confiado por equipes em
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {LOGOS.map(l => <span key={l} style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-disabled)' }}>{l}</span>)}
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 max-w-lg mx-auto">
            <div className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border-default)' }}>
              {STATS.map((s, i) => (
                <div key={s.label} className="flex flex-col items-center justify-center py-5 px-4"
                  style={{ borderRight: i < STATS.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div className="stat-number">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" aria-hidden>
          <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-disabled)' }}>Scroll</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
            className="w-px h-8" style={{ background: 'linear-gradient(to bottom, var(--text-disabled), transparent)' }} />
        </motion.div>
      </section>

      {/* FEATURES */}
      <RevealSection>
        <div style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-raised)' }}>
          <div className="container section">
            <div className="max-w-lg mb-12">
              <div className="tag-label">Plataforma</div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
                Tudo que você precisa, <span style={{ color: 'var(--text-secondary)' }}>nada que não.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="card-flat p-6 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.accent}10`, border: `1px solid ${f.accent}20` }}>
                    <f.icon size={16} style={{ color: f.accent }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.65 }}>{f.desc}</p>
                  <div className="mt-5 h-px w-0 transition-all duration-300 group-hover:w-full"
                    style={{ background: `linear-gradient(90deg, ${f.accent}50, transparent)` }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* FEATURED PRODUCTS */}
      <RevealSection className="section">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="tag-label">Destaques</div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                Produtos em alta
              </h2>
            </div>
            <Link href="/shop"
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--text-tertiary)', transition: 'color 0.15s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}>
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        </div>
      </RevealSection>

      {/* CTA */}
      <RevealSection className="section-sm">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)' }}>
            <div aria-hidden className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 110%, rgba(0,212,255,0.06) 0%, transparent 60%)' }} />
            <div className="divider-accent absolute top-0 left-0 right-0" />
            <div className="relative z-10 max-w-lg mx-auto">
              <span className="badge badge-cyan mb-4">Comece hoje</span>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 12 }}>
                Pronto para escalar<br />seu negócio?
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-tertiary)', marginBottom: 24, lineHeight: 1.6 }}>
                Crie sua conta grátis e ganhe 10% de desconto na primeira compra.
              </p>
              <Link href="/register">
                <button className="btn-primary">Começar grátis <ArrowRight size={15} /></button>
              </Link>
            </div>
            <div className="divider-accent absolute bottom-0 left-0 right-0" />
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
