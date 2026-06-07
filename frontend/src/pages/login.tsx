'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Zap, Chrome } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const FADE_UP = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show:   { opacity: 1, y: 0,  filter: 'blur(0px)' },
};

export default function LoginPage() {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [totp,      setTotp]      = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [need2FA,   setNeed2FA]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        totpCode: totp || undefined,
      });

      if (data.requiresTwoFactor) {
        setNeed2FA(true);
        setLoading(false);
        return;
      }

      setTokens(data.data.accessToken, data.data.refreshToken);
      setUser(data.data.user);
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 bg-grid"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Glow */}
      <div
        aria-hidden
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-[0.06]"
        style={{ background: 'radial-gradient(ellipse, var(--accent-cyan) 0%, transparent 70%)' }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        className="w-full max-w-[380px] relative z-10"
      >
        {/* Logo */}
        <motion.div variants={FADE_UP} className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
          >
            <Zap size={16} fill="black" color="black" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            nexus
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={FADE_UP}
          className="card-flat p-7"
        >
          <div className="mb-6">
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {need2FA ? 'Verificação em 2 etapas' : 'Bem-vindo de volta'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {need2FA
                ? 'Digite o código do seu autenticador'
                : 'Entre com sua conta para continuar'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#fb7185' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!need2FA ? (
              <>
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    E-mail
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                      Senha
                    </label>
                    <Link
                      href="/forgot-password"
                      style={{ fontSize: 12, color: 'var(--accent-cyan)', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                    >
                      Esqueceu?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-disabled)', transition: 'color 0.15s' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-disabled)')}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* 2FA code */
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Código de 6 dígitos
                </label>
                <input
                  className="input text-center text-lg tracking-[0.3em] font-mono"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totp}
                  onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ justifyContent: 'center' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full inline-block"
                  />
                  Entrando…
                </span>
              ) : (
                <>
                  {need2FA ? 'Verificar' : 'Entrar'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {!need2FA && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ou
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
              </div>

              {/* OAuth */}
              <div className="flex flex-col gap-2">
                {[
                  { provider: 'google',   label: 'Continuar com Google',  icon: '🔵' },
                  { provider: 'discord',  label: 'Continuar com Discord', icon: '🟣' },
                  { provider: 'facebook', label: 'Continuar com Facebook',icon: '🔷' },
                ].map(({ provider, label, icon }) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleOAuth(provider)}
                    className="btn-ghost w-full"
                    style={{ justifyContent: 'center', fontSize: 13, gap: 8 }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Footer link */}
        <motion.p variants={FADE_UP} className="text-center mt-5" style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
          Não tem uma conta?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--accent-cyan)', fontWeight: 500, transition: 'opacity 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            Criar conta grátis
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
