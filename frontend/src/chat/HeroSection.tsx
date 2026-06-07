'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
};

const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
};

const LOGOS = ['Stripe', 'Linear', 'Vercel', 'Notion', 'Figma', 'GitHub'];

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const yContent  = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const opacity   = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const yOrb1     = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const yOrb2     = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-grid noise"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Gradient orbs ── */}
      <motion.div
        style={{ y: yOrb1 }}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse at center, var(--accent-cyan) 0%, transparent 65%)', filter: 'blur(1px)' }}
        />
      </motion.div>

      <motion.div
        style={{ y: yOrb2 }}
        aria-hidden
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse at center, var(--accent-violet) 0%, transparent 65%)' }}
        />
      </motion.div>

      {/* ── Content ── */}
      <motion.div
        style={{ y: yContent, opacity }}
        className="relative z-10 container flex flex-col items-center text-center"
      >
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-6 max-w-4xl"
        >
          {/* Label */}
          <motion.div variants={FADE_UP}>
            <span className="badge badge-cyan">
              <Sparkles size={10} />
              Plataforma de próxima geração
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={FADE_UP}
            className="text-display text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            O comércio{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, var(--accent-cyan), #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              reimaginado
            </span>
            <br />
            para empresas.
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={FADE_UP}
            className="text-subtitle text-balance max-w-xl"
          >
            Infraestrutura de e-commerce enterprise — rápida, segura e escala com o seu negócio
            sem esforço.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={FADE_UP} className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link href="/shop">
              <button className="btn-primary">
                Explorar loja
                <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/register">
              <button className="btn-ghost">
                Criar conta grátis
              </button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={FADE_UP}
            className="flex flex-col items-center gap-3 mt-4"
          >
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Confiado por equipes em
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {LOGOS.map(name => (
                <span
                  key={name}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-disabled)',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Stats bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 w-full max-w-2xl"
        >
          <div
            className="grid grid-cols-3 divide-x rounded-2xl overflow-hidden"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-default)',
              divideColor: 'var(--border-subtle)',
            }}
          >
            {[
              { value: '50k+',  label: 'Produtos ativos' },
              { value: '120k+', label: 'Clientes satisfeitos' },
              { value: '99.9%', label: 'Uptime garantido' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-5 px-4" style={{ borderRight: '1px solid var(--border-subtle)' }}>
                <div className="stat-number">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden
      >
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8"
          style={{ background: 'linear-gradient(to bottom, var(--text-disabled), transparent)' }}
        />
      </motion.div>
    </section>
  );
}
