'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Bot } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

interface Message {
  id: string; body: string; userId: string; isStaff: boolean; createdAt: string;
  user: { id: string; username: string; firstName?: string; role: string };
}

const SUGGESTIONS = ['Rastrear pedido', 'Política de devolução', 'Formas de pagamento', 'Falar com humano'];

const BOT_INTRO: Message[] = [{
  id: 'bot-1', body: 'Olá! Como posso ajudar você hoje?',
  userId: 'bot', isStaff: true, createdAt: new Date().toISOString(),
  user: { id: 'bot', username: 'nexus', firstName: 'Nexus', role: 'BOT' },
}];

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function ChatWidget() {
  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState('');
  const [typing,    setTyping]    = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [socket,    setSocket]    = useState<Socket | null>(null);
  const [roomId,    setRoomId]    = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const endRef      = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const { user, accessToken } = useAuthStore();

  const scrollEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollEnd(); }, [messages, scrollEnd]);

  useEffect(() => {
    if (!open || socket) return;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';
    const s = io(wsUrl, { auth: { token: accessToken }, transports: ['websocket'] });
    s.on('connect', () => {
      const room = user ? `user_${user.id}` : `guest_${Date.now()}`;
      setRoomId(room);
      s.emit('chat:join', { roomId: room });
    });
    s.on('chat:history', ({ messages: h }: { messages: Message[] }) => {
      setMessages(h); setShowIntro(h.length === 0);
    });
    s.on('chat:message', (msg: Message) => {
      setMessages(p => [...p, msg]);
      if (!open || minimized) setUnread(n => n + 1);
    });
    s.on('chat:typing',      ({ userId: uid }: { userId: string }) => { if (uid !== user?.id) setTyping(true); });
    s.on('chat:stop_typing', ({ userId: uid }: { userId: string }) => { if (uid !== user?.id) setTyping(false); });
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const send = () => {
    const text = input.trim();
    if (!text || !socket || !roomId) return;
    socket.emit('chat:message', { roomId, body: text });
    setInput(''); setShowIntro(false);
    socket.emit('chat:stop_typing', { roomId });
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !roomId) return;
    socket.emit('chat:typing', { roomId });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => socket.emit('chat:stop_typing', { roomId }), 2000);
  };

  const allMessages = showIntro ? BOT_INTRO : messages;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            onClick={() => { setOpen(true); setMinimized(false); setUnread(0); setTimeout(() => inputRef.current?.focus(), 300); }}
            aria-label="Abrir suporte"
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl flex items-center justify-center relative"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', transition: 'border-color 0.15s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.35)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)')}
          >
            <MessageCircle size={18} style={{ color: 'var(--accent-cyan)' }} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'var(--accent-cyan)', color: '#000' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, height: minimized ? 56 : 460 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', transformOrigin: 'bottom right' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 flex-shrink-0"
              style={{ height: 56, borderBottom: minimized ? 'none' : '1px solid var(--border-subtle)', background: 'var(--bg-raised)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <Bot size={14} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', lineHeight: 1 }}>Suporte Nexus</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="dot-online" style={{ width: 5, height: 5 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setMinimized(v => !v)} aria-label="Minimizar">
                  <Minimize2 size={13} />
                </button>
                <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => setOpen(false)} aria-label="Fechar">
                  <X size={13} />
                </button>
              </div>
            </div>

            {!minimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 no-scrollbar">
                  {allMessages.map(msg => {
                    const isOwn = msg.userId === user?.id;
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isOwn && (
                          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                            {msg.isStaff ? <Bot size={11} style={{ color: 'var(--accent-cyan)' }} />
                              : <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa' }}>{(msg.user.firstName?.[0] || msg.user.username[0]).toUpperCase()}</span>}
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[220px] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && msg.isStaff && (
                            <span style={{ fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 500, marginLeft: 2 }}>
                              {msg.user.firstName || msg.user.username}
                            </span>
                          )}
                          <div style={{
                            padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                            borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: isOwn ? 'var(--accent-cyan)' : 'var(--bg-subtle)',
                            color: isOwn ? '#000' : 'var(--text-primary)',
                            border: isOwn ? 'none' : '1px solid var(--border-subtle)',
                          }}>
                            {msg.body}
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-disabled)', margin: '0 2px' }}>
                            {fmtTime(msg.createdAt)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {showIntro && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      className="flex flex-wrap gap-1.5 ml-8">
                      {SUGGESTIONS.map(s => (
                        <button key={s}
                          onClick={() => { setInput(s); setShowIntro(false); inputRef.current?.focus(); }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', transition: 'border-color 0.15s, color 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-cyan)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {typing && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                        className="flex items-end gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                          <Bot size={11} style={{ color: 'var(--accent-cyan)' }} />
                        </div>
                        <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-tl-sm"
                          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                          {[0, 1, 2].map(i => (
                            <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-tertiary)' }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {!user && (
                    <p style={{ fontSize: 11, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 8 }}>
                      Visitante · <a href="/login" style={{ color: 'var(--accent-cyan)' }}>Faça login</a> para salvar histórico
                    </p>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', transition: 'border-color 0.15s' }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)')}
                    onBlurCapture={e  => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
                    <input ref={inputRef} type="text" value={input} onChange={onInput}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Digite uma mensagem…"
                      className="flex-1 bg-transparent outline-none"
                      style={{ fontSize: 13, color: 'var(--text-primary)' }} />
                    <motion.button onClick={send} whileTap={{ scale: 0.85 }} disabled={!input.trim()}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-30"
                      style={{ background: input.trim() ? 'var(--accent-cyan)' : 'var(--bg-subtle)', transition: 'background 0.15s' }}
                      aria-label="Enviar">
                      <Send size={13} style={{ color: input.trim() ? '#000' : 'var(--text-tertiary)' }} />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
