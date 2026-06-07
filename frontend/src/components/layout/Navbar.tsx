'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Bell, Menu, X, ChevronDown, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

const NAV_LINKS = [
  {
    label: 'Produtos', href: '/shop',
    sub: [
      { label: 'Eletrônicos',  href: '/shop?category=electronics' },
      { label: 'Smartphones',  href: '/shop?category=smartphones' },
      { label: 'Games',        href: '/shop?category=games' },
      { label: 'Moda',         href: '/shop?category=fashion' },
      { label: 'Acessórios',   href: '/shop?category=accessories' },
    ],
  },
  { label: 'Ofertas',    href: '/deals' },
  { label: 'Novidades',  href: '/new' },
];

export function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [dropdown,    setDropdown]    = useState<string | null>(null);
  const totalItems = useCartStore(s => s.totalItems());
  const { user }   = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
        style={{ transition: 'background 0.35s, border-color 0.35s' }}
      >
        <div className="container flex items-center justify-between h-full gap-6">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 16px rgba(0,212,255,0.4)' }}
            >
              <Zap size={14} fill="black" color="black" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              nexus
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(link => (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => link.sub && setDropdown(link.label)}
                onMouseLeave={() => setDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--text-secondary)', transition: 'color 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                >
                  {link.label}
                  {link.sub && <ChevronDown size={12} style={{ opacity: 0.5 }} />}
                </Link>

                <AnimatePresence>
                  {link.sub && dropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full left-0 mt-1 py-1 rounded-xl min-w-[190px]"
                      style={{
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                      }}
                    >
                      {link.sub.map(s => (
                        <Link
                          key={s.href} href={s.href}
                          className="flex items-center px-3 py-2 text-sm rounded-lg mx-1"
                          style={{ color: 'var(--text-secondary)', transition: 'color 0.15s, background 0.15s' }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = 'var(--text-primary)';
                            el.style.background = 'var(--glass-bg)';
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.color = 'var(--text-secondary)';
                            el.style.background = 'transparent';
                          }}
                        >
                          {s.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2">
            <button className="btn-icon hidden sm:flex" aria-label="Buscar">
              <Search size={15} />
            </button>

            {user && (
              <button className="btn-icon hidden sm:flex relative" aria-label="Notificações">
                <Bell size={15} />
                <span
                  className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                  style={{ background: 'var(--accent-cyan)' }}
                />
              </button>
            )}

            <Link href="/cart">
              <button className="btn-icon relative" aria-label="Carrinho">
                <ShoppingBag size={15} />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--accent-cyan)', color: '#000' }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </button>
            </Link>

            {user ? (
              <Link href="/account">
                <button
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--accent-violet)', color: '#fff' }}
                  >
                    {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {user.firstName || user.username}
                  </span>
                </button>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <button className="btn-ghost py-2 px-4" style={{ fontSize: 13 }}>Entrar</button>
                </Link>
                <Link href="/register">
                  <button className="btn-primary py-2 px-4" style={{ fontSize: 13 }}>Criar conta</button>
                </Link>
              </div>
            )}

            <button
              className="btn-icon md:hidden"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-50 w-72 flex flex-col"
            style={{ background: 'var(--bg-overlay)', borderLeft: '1px solid var(--border-default)' }}
          >
            <div
              className="flex items-center justify-between px-5 h-[60px] flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Menu</span>
              <button className="btn-icon" onClick={() => setMobileOpen(false)}>
                <X size={15} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href} href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--text-secondary)', transition: 'color 0.15s, background 0.15s' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {user ? (
                <Link href="/account" onClick={() => setMobileOpen(false)}>
                  <button className="btn-ghost w-full">Minha conta</button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <button className="btn-ghost w-full">Entrar</button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <button className="btn-primary w-full">Criar conta</button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
