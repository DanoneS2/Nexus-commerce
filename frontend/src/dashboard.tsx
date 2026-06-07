'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown, ArrowRight, MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';

const fmt    = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR').format(v);

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING:{ label:'Aguardando', color:'#f59e0b' }, PAYMENT_PROCESSING:{ label:'Processando', color:'#00D4FF' },
  PAID:{ label:'Pago', color:'#7C3AED' }, PREPARING:{ label:'Preparando', color:'#a78bfa' },
  SHIPPED:{ label:'Enviado', color:'#60a5fa' }, DELIVERED:{ label:'Entregue', color:'#22C55E' },
  CANCELLED:{ label:'Cancelado', color:'#f43f5e' }, REFUNDED:{ label:'Reembolsado', color:'#71717a' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i/(data.length-1))*100},${100-(v/max)*100}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function BarChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.slice(-21).map((d, i) => (
        <motion.div key={d.date} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.02, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 rounded-sm" title={`${d.date}: ${fmt(d.revenue)}`}
          style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%`, transformOrigin: 'bottom', background: `rgba(0,212,255,${0.15+(d.revenue/max)*0.55})`, transition: 'background 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--accent-cyan)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = `rgba(0,212,255,${0.15+(d.revenue/max)*0.55})`)} />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, sparkData, accentColor, delay }: {
  icon: React.ElementType; label: string; value: string; change?: number;
  sparkData?: number[]; accentColor: string; delay?: number;
}) {
  const isPos = (change ?? 0) >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-flat p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}20` }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
            style={{ background: isPos ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)', color: isPos ? 'var(--accent-green)' : '#f43f5e' }}>
            {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div>
        <div className="stat-number">{value}</div>
        <div className="stat-label mt-1">{label}</div>
      </div>
      {sparkData && sparkData.length > 1 && (
        <div className="h-8 opacity-60"><Sparkline data={sparkData} color={accentColor} /></div>
      )}
    </motion.div>
  );
}

interface DashData {
  revenue: { total: number; change: number }; orders: { total: number; change: number };
  customers: { total: number; change: number }; products: { total: number; active: number };
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }>;
}
type Period = '7d' | '30d' | '90d';

export default function AdminDashboard() {
  const [data, setData]     = useState<DashData | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    setLoad(true);
    api.get(`/admin/analytics/dashboard?period=${period}`)
      .then(r => setData(r.data.data)).catch(console.error).finally(() => setLoad(false));
  }, [period]);

  const sparkRevenue = data?.salesByDay.map(d => d.revenue) ?? [];
  const sparkOrders  = data?.salesByDay.map(d => d.orders) ?? [];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 3 }}>Visão geral da plataforma</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
            {(['7d','30d','90d'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: period===p ? 'var(--glass-bg)' : 'transparent', color: period===p ? 'var(--text-primary)' : 'var(--text-tertiary)', border: period===p ? '1px solid var(--border-default)' : '1px solid transparent' }}>
                {p==='7d'?'7 dias':p==='30d'?'30 dias':'90 dias'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-36 rounded-2xl" />) : (
            <>
              <StatCard icon={DollarSign} label="Receita" value={fmt(data?.revenue.total??0)} change={data?.revenue.change} sparkData={sparkRevenue} accentColor="var(--accent-cyan)" delay={0} />
              <StatCard icon={ShoppingBag} label="Pedidos" value={fmtNum(data?.orders.total??0)} change={data?.orders.change} sparkData={sparkOrders} accentColor="var(--accent-violet)" delay={0.05} />
              <StatCard icon={Users} label="Clientes" value={fmtNum(data?.customers.total??0)} change={data?.customers.change} accentColor="var(--accent-cyan)" delay={0.1} />
              <StatCard icon={Package} label="Ativos" value={fmtNum(data?.products.active??0)} accentColor="var(--accent-violet)" delay={0.15} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="card-flat p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em', color:'var(--text-primary)' }}>Receita diária</p>
                <p style={{ fontSize:12, color:'var(--text-tertiary)', marginTop:2 }}>Período: {period}</p>
              </div>
              <button className="btn-icon"><MoreHorizontal size={14} /></button>
            </div>
            {loading ? <div className="skeleton h-20 rounded-xl" /> : <BarChart data={data?.salesByDay??[]} />}
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }} className="card-flat p-5">
            <p style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em', color:'var(--text-primary)', marginBottom:16 }}>Top produtos</p>
            <div className="flex flex-col gap-3">
              {loading ? Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-6 rounded-lg" />) :
                data?.topProducts.slice(0,5).map((p,i) => {
                  const maxS = data.topProducts[0]?.sales || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span style={{ fontSize:11, fontWeight:700, width:14, textAlign:'right', color: i===0?'#f59e0b':'var(--text-disabled)' }}>{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize:12, color:'var(--text-primary)' }}>{p.name}</p>
                        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background:'var(--bg-subtle)' }}>
                          <motion.div initial={{ width:0 }} animate={{ width:`${(p.sales/maxS)*100}%` }}
                            transition={{ delay:0.3+i*0.05, duration:0.5 }}
                            className="h-full rounded-full"
                            style={{ background: i===0?'var(--accent-cyan)':'var(--bg-muted)' }} />
                        </div>
                      </div>
                      <span style={{ fontSize:11, color:'var(--text-tertiary)', whiteSpace:'nowrap' }}>{p.sales}</span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="card-flat overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid var(--border-subtle)' }}>
            <p style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em', color:'var(--text-primary)' }}>Pedidos recentes</p>
            <button className="flex items-center gap-1.5 text-xs font-medium" style={{ color:'var(--accent-cyan)' }}>
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                  {['Pedido','Cliente','Valor','Status','Data'].map(col => (
                    <th key={col} style={{ padding:'10px 20px', textAlign:'left', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-disabled)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:6}).map((_,i) => (
                  <tr key={i}>{Array.from({length:5}).map((_,j) => <td key={j} style={{ padding:'12px 20px' }}><div className="skeleton h-3.5 rounded" /></td>)}</tr>
                )) : data?.recentOrders.map((order, i) => {
                  const st = STATUS[order.status] ?? { label: order.status, color: 'var(--text-tertiary)' };
                  return (
                    <motion.tr key={order.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.04*i }}
                      style={{ borderBottom:'1px solid var(--border-subtle)', transition:'background 0.15s', cursor:'pointer' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                      <td style={{ padding:'12px 20px' }}><span style={{ fontSize:13, fontFamily:'var(--font-mono)', color:'var(--accent-cyan)' }}>#{order.orderNumber}</span></td>
                      <td style={{ padding:'12px 20px' }}><span style={{ fontSize:13, color:'var(--text-primary)' }}>{order.customerName}</span></td>
                      <td style={{ padding:'12px 20px' }}><span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', fontVariantNumeric:'tabular-nums' }}>{fmt(order.total)}</span></td>
                      <td style={{ padding:'12px 20px' }}><span className="badge" style={{ fontSize:10, background:`${st.color}12`, color:st.color, borderColor:`${st.color}25` }}>{st.label}</span></td>
                      <td style={{ padding:'12px 20px' }}><span style={{ fontSize:12, color:'var(--text-tertiary)' }}>{new Date(order.createdAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
