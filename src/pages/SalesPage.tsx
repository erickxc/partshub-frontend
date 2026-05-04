import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { Sale } from '../types';

const METHOD_LABEL: Record<string, string> = { cash: 'Dinheiro', debit_card: 'Débito', credit_card: 'Crédito', pix: 'Pix', check: 'Cheque' };

export function SalesPage() {
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => api.get('/api/pdv/sales').then((r) => r.data),
  });
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="text-xs text-ph-soft mt-0.5">{sales.length} registro(s)</p>
        </div>
        <Link to="/pdv" className="btn-primary"><Plus className="w-3.5 h-3.5" /> Nova Venda</Link>
      </div>
      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-6xl table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Data/Hora</th><th>Cliente</th><th>Itens</th><th>Pagamento</th><th className="text-right">Desconto</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
              {!isLoading && sales.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-ph-soft">Nenhuma venda registrada</td></tr>}
              {sales.map((s: any) => (
                <tr key={s.id}>
                  <td><span className="sku">#{String(s.number).padStart(4, '0')}</span></td>
                  <td className="mono text-xs text-ph-soft">{new Date(s.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="font-medium">{s.customer?.name ?? 'Avulso'}</td>
                  <td className="text-ph-soft text-xs">{s.items?.length ?? 0} item(s)</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.payments?.map((p: any, i: number) => (
                        <span key={i} className="badge-gray">{METHOD_LABEL[p.method] ?? p.method}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-right mono text-ph-soft">{fmt(s.discount)}</td>
                  <td className="text-right price">{fmt(Number(s.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
