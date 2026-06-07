'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const PERKS = [
  'Sem cartão de crédito',
  'Deploy em minutos',
  'Suporte 24/7',
];

export function CTASection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="section" style={{ background: 'var(--bg-base)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'var(--bg-raised)',
            border:     '1px solid var(--border-default)',
          }}
        >
          {/* Glow blobs */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 10% 50%, rgba(0,212,255,0.05) 0%, transparent 60%),
                radial-gradient(ellipse 50% 60% at 90% 50%, rgba(124,58,237,0.05) 0%, transparent 60%)
              `,
            }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 0%, var(--accent-cyan) 30%, var(--accent-violet) 70%, transparent 100%)', opacity: 0.4 }}
          />

          <div className="relative z-10 px-8 py-16 md:px-16 flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <p
                className="tag-label justify-center md:justify-start"
                style={{ marginBottom: 16 }}
              >
                Comece hoje
              </p>
              <h2
                className="text-headline mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Pronto para escalar
                <br />
                <span style={{ color: 'var(--text-secondary)' }}>seu negócio?</span>
              </h2>
              <p className="text-body mb-8" style={{ color: 'var(--text-tertiary)', maxWidth: 420 }}>
                Junte-se a mais de 120 mil empresas que confiam na Nexus Commerce para
                vender mais, com mais segurança e mais velocidade.
              </p>

              {/* Perks */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start mb-8">
                {PERKS.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
                    >
                      <Check size={9} style={{ color: 'var(--accent-green)' }} />
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                <Link href="/register">
                  <button className="btn-primary">
                    Criar conta grátis
                    <ArrowRight size={15} />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="btn-ghost">
                    Falar com vendas
                  </button>
                </Link>
              </div>
            </div>

            {/* Right card — plan preview */}
            <div
              className="w-full md:w-72 flex-shrink-0 rounded-2xl p-6"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--border-default)',
              }}
            >
              {/* Plan badge */}
              <div className="flex items-center justify-between mb-5">
                <span className="badge badge-cyan">Plano Free</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Para começar</span>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--text-primary)', lineHeight: 1 }}>
                  R$ 0
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-tertiary)' }}>/mês</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  Para sempre grátis
                </p>
              </div>

              <div className="divider mb-5" />

              {/* Features */}
              <ul className="flex flex-col gap-3">
                {[
                  'Até 100 produtos',
                  'Chat de suporte',
                  'Dashboard analytics',
                  'SSL incluso',
                  'Atualizações automáticas',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check size={12} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link href="/register">
                  <button className="btn-primary w-full justify-center">
                    Começar grátis
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
