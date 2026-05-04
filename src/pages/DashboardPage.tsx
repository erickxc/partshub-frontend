import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

function StatCard({ label, value, sub, icon: Icon, accent = false }: any) {
  return (
    <div className={`card p-4 ${accent ? 'border-ph-accent bg-ph-accent/5' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ph-soft">{label}</p>
          <p className="mono text-2xl font-bold mt-1 text-ph-text truncate">{value}</p>
          {sub && <p className="text-xs text-ph-soft mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 flex-shrink-0 ${accent ? 'bg-ph-accent' : 'bg-ph-surface-2 border border-ph-border'}`} style={{ borderRadius: 4 }}>
          <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-ph-soft'}`} />
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/sales/dashboard').then((r) => r.data),
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-xs text-ph-soft mt-0.5">{user?.tenantName} — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <Link to="/pdv" className="btn-primary">
          <Plus className="w-3.5 h-3.5" />
          Nova Venda
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-ph-soft text-sm">Carregando...</div>
        ) : (
          <div className="max-w-5xl space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Vendas Hoje" value={fmt(data?.today?.total)} sub={`${data?.today?.count ?? 0} venda(s)`} icon={ShoppingCart} accent />
              <StatCard label="Vendas no Mês" value={fmt(data?.month?.total)} sub={`${data?.month?.count ?? 0} venda(s)`} icon={TrendingUp} />
              <StatCard label="Estoque Crítico" value={data?.lowStockCount ?? 0} sub="itens abaixo do mínimo" icon={AlertTriangle} />
            </div>

            <div className="card">
              <div className="px-4 py-3 border-b border-ph-surface-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ph-soft">Últimas Vendas</span>
                <Link to="/sales" className="flex items-center gap-1 text-xs text-ph-accent hover:text-ph-accent-h font-semibold">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {data?.recentSales?.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ph-soft">Nenhuma venda registrada</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Cliente</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentSales?.map((s: any) => (
                      <tr key={s.id}>
                        <td className="text-ph-soft mono text-xs">{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="font-medium">{s.customer?.name ?? 'Avulso'}</td>
                        <td className="text-right price">{fmt(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
