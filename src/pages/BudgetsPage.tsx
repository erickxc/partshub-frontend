import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, ChevronDown, CheckCircle, X } from 'lucide-react';
import { api } from '../lib/api';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Rascunho',   cls: 'badge-gray' },
  sent:      { label: 'Enviado',    cls: 'badge-blue' },
  approved:  { label: 'Aprovado',   cls: 'badge-green' },
  rejected:  { label: 'Recusado',   cls: 'badge-red' },
  expired:   { label: 'Vencido',    cls: 'badge-red' },
  converted: { label: 'Convertido', cls: 'badge-orange' },
};

const METHODS = [
  { id: 'cash', label: 'Dinheiro' }, { id: 'pix', label: 'Pix' },
  { id: 'debit_card', label: 'Débito' }, { id: 'credit_card', label: 'Crédito' },
];

function ConvertModal({ budget, onClose }: { budget: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [payments, setPayments] = useState([{ method: 'cash', amount: Number(budget.total) }]);
  const convert = useMutation({
    mutationFn: () => api.post(`/api/pdv/budgets/${budget.id}/convert`, { payments }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <div>
            <h2 className="font-bold">Converter em Venda</h2>
            <p className="text-xs text-ph-soft">Orçamento #{String(budget.number).padStart(4, '0')}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="price">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(budget.total)}</span>
          </div>
          <label className="label">Forma de Pagamento</label>
          {payments.map((p, i) => (
            <div key={i} className="flex gap-2">
              <select className="input flex-1" value={p.method} onChange={(e) => setPayments((prev) => prev.map((x, j) => j === i ? { ...x, method: e.target.value } : x))}>
                {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <input type="number" className="input mono w-28 text-right" value={p.amount} onChange={(e) => setPayments((prev) => prev.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x))} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center" disabled={convert.isPending} onClick={() => convert.mutate()}>
            {convert.isPending ? 'Convertendo...' : 'Converter'}
          </button>
        </div>
        {convert.isError && <p className="text-red-600 text-xs text-center pb-3">{(convert.error as any)?.response?.data?.message ?? 'Erro'}</p>}
      </div>
    </div>
  );
}

export function BudgetsPage() {
  const [converting, setConverting] = useState<any>(null);
  const qc = useQueryClient();
  const { data: budgets = [], isLoading } = useQuery<any[]>({
    queryKey: ['budgets'],
    queryFn: () => api.get('/api/pdv/budgets').then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/pdv/budgets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orçamentos</h1>
          <p className="text-xs text-ph-soft mt-0.5">{budgets.length} orçamento(s)</p>
        </div>
        <Link to="/pdv" className="btn-primary"><Plus className="w-3.5 h-3.5" /> Novo Orçamento</Link>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-6xl table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Data</th><th>Cliente</th><th>Itens</th><th>Validade</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Ações</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
              {!isLoading && budgets.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-ph-soft">Nenhum orçamento</td></tr>}
              {budgets.map((b) => {
                const st = STATUS_LABEL[b.status] ?? STATUS_LABEL.draft;
                const expired = b.validUntil && new Date(b.validUntil) < new Date() && b.status === 'sent';
                return (
                  <tr key={b.id}>
                    <td><span className="sku">#{String(b.number).padStart(4, '0')}</span></td>
                    <td className="mono text-xs text-ph-soft">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="font-medium">{b.customer?.name ?? 'Avulso'}</td>
                    <td className="text-ph-soft text-xs">{b.items?.length ?? 0} item(s)</td>
                    <td className="mono text-xs text-ph-soft">{b.validUntil ? new Date(b.validUntil).toLocaleDateString('pt-BR') : '—'}</td>
                    <td><span className={expired ? 'badge-red' : st.cls}>{expired ? 'Vencido' : st.label}</span></td>
                    <td className="text-right price">{fmt(Number(b.total))}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.status === 'draft' && (
                          <button className="btn-secondary btn-sm" onClick={() => updateStatus.mutate({ id: b.id, status: 'sent' })}>Enviar</button>
                        )}
                        {(b.status === 'sent' || b.status === 'approved') && b.status !== 'converted' && (
                          <button className="btn-primary btn-sm" onClick={() => setConverting(b)}>
                            <CheckCircle className="w-3 h-3" /> Vender
                          </button>
                        )}
                        {b.status === 'draft' && (
                          <button className="btn-ghost btn-sm text-red-400" onClick={() => updateStatus.mutate({ id: b.id, status: 'rejected' })}>Cancelar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {converting && <ConvertModal budget={converting} onClose={() => setConverting(null)} />}
    </div>
  );
}
