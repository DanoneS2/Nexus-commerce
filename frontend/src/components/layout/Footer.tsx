'use client';
import Link from 'next/link';
import { Zap, Github, Twitter, Linkedin } from 'lucide-react';

const LINKS = {
  Produto: [
    { label: 'Loja',        href: '/shop' },
    { label: 'Categorias',  href: '/shop' },
    { label: 'Ofertas',     href: '/deals' },
    { label: 'Novidades',   href: '/new' },
  ],
  Empresa: [
    { label: 'Sobre',       href: '/about' },
    { label: 'Blog',        href: '/blog' },
    { label: 'Carreiras',   href: '/careers' },
    { label: 'Contato',     href: '/contact' },
  ],
  Suporte: [
    { label: 'Central de Ajuda', href: '/help' },
    { label: 'Meus Pedidos',     href: '/orders' },
    { label: 'Devoluções',       href: '/returns' },
    { label: 'Status',           href: '/status' },
  ],
  Legal: [
    { label: 'Privacidade',   href: '/privacy' },
    { label: 'Termos de Uso', href: '/terms' },
    { label: 'Cookies',       href: '/cookies' },
    { label: 'LGPD',          href: '/lgpd' },
  ],
};

const SOCIALS = [
  { icon: Github,   href: 'https://github.com', label: 'GitHub' },
  { icon: Twitter,  href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--bg-raised)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="container">

        {/* Main grid */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-6 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 12px rgba(0,212,255,0.3)' }}
              >
                <Zap size={14} fill="black" color="black" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                nexus
              </span>
            </Link>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7, maxWidth: 220 }}>
              Plataforma de e-commerce enterprise para empresas que precisam escalar.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2 mt-5">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="btn-icon"
                >
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p
                style={{
                  fontSize:      11,
                  fontWeight:    600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color:         'var(--text-disabled)',
                  marginBottom:  14,
                }}
              >
                {section}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize:   13,
                        color:      'var(--text-tertiary)',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between py-5 gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
            © {new Date().getFullYear()} Nexus Commerce. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="dot-online" />
            <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
              Todos os sistemas operacionais
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
