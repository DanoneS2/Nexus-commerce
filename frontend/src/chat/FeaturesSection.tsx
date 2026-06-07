'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Shield, Globe, TrendingUp, Lock, Cpu } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Performance extrema',
    desc: 'CDN global com edge caching. Carregamento em < 100ms independente da localização.',
    accent: 'var(--accent-cyan)',
  },
  {
    icon: Shield,
    title: 'Segurança enterprise',
    desc: 'Criptografia de ponta a ponta, 2FA, RBAC completo e monitoramento em tempo real.',
    accent: 'var(--accent-violet)',
  },
  {
    icon: Globe,
    title: 'Escala global',
    desc: 'Multi-região, multi-moeda e suporte a 6 idiomas. Pronto para qualquer mercado.',
    accent: 'var(--accent-cyan)',
  },
  {
    icon: TrendingUp,
    title: 'Analytics avançado',
    desc: 'Dashboards em tempo real com métricas de conversão, receita e comportamento.',
    accent: 'var(--accent-violet)',
  },
  {
    icon: Lock,
    title: 'Compliance total',
    desc: 'LGPD, PCI DSS e SOC 2. Auditoria completa de todas as operações da plataforma.',
    accent: 'var(--accent-cyan)',
  },
  {
    icon: Cpu,
    title: 'API-first',
    desc: 'REST API documentada + webhooks. Integre com qualquer sistema em minutos.',
    accent: 'var(--accent-violet)',
  },
];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
};

export function FeaturesSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="section" style={{ background: 'var(--bg-raised)' }}>
      {/* Border top accent */}
      <div className="divider-accent mb-0" />

      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mb-16"
        >
          <div className="tag-label">Plataforma</div>
          <h2 className="text-headline mb-4" style={{ color: 'var(--text-primary)' }}>
            Tudo que você precisa,{' '}
            <br />
            <span style={{ color: 'var(--text-secondary)' }}>nada que você não precisa.</span>
          </h2>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Construído para equipes que não aceitam compromissos entre velocidade,
            segurança e escalabilidade.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              variants={CARD_VARIANTS}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="card-flat p-6 group"
              style={{ cursor: 'default' }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${feat.accent}10`,
                  border: `1px solid ${feat.accent}20`,
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${feat.accent}20`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <feat.icon
                  size={16}
                  style={{ color: feat.accent }}
                />
              </div>

              {/* Text */}
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
              >
                {feat.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)', lineHeight: 1.65 }}>
                {feat.desc}
              </p>

              {/* Bottom accent line — appears on hover */}
              <div
                className="mt-5 h-px w-0 transition-all duration-300 group-hover:w-full"
                style={{ background: `linear-gradient(90deg, ${feat.accent}40, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="divider-accent mt-0" />
    </section>
  );
}
