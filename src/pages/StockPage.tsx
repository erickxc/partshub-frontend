import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { api } from '../lib/api';
import type { StockItem } from '../types';

function AdjustModal({ item, onClose }: { item: StockItem; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');

  const adj = useMutation({
    mutationFn: () => api.post('/api/stock/adjust', {
      productId: item.product.id,
      quantity: type === 'in' ? Number(qty) : -Number(qty),
      reason,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <div>
            <h2 className="font-bold text-ph-text">Ajustar Estoque</h2>
            <p className="text-xs text-ph-soft mt-0.5">{item.product.name}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 bg-ph-surface-2 px-3 py-2 border border-ph-border" style={{ borderRadius: 4 }}>
            <span className="text-xs text-ph-soft uppercase tracking-wider font-semibold">Estoque atual</span>
            <span className="mono font-bold text-ph-text ml-auto">{item.quantity} {(item.product as any).unit ?? 'un'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType('in')}
              className={type === 'in' ? 'pay-btn-active' : 'pay-btn-inactive'}
            >
              <ArrowUp className="w-4 h-4" />
              <span>Entrada</span>
            </button>
            <button
              onClick={() => setType('out')}
              className={type === 'out' ? 'bg-red-600 text-white border border-red-600 flex flex-col items-center justify-center gap-1 p-3 text-sm font-semibold' : 'pay-btn-inactive'}
              style={{ borderRadius: 4 }}
            >
              <ArrowDown className="w-4 h-4" />
              <span>Saída</span>
            </button>
          </div>

          <div>
            <label className="label">Quantidade</label>
            <input className="input mono" type="number" min="1" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" placeholder="Compra, devolução, ajuste..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary flex-1 justify-center"
            disabled={!qty || !reason || adj.isPending}
            onClick={() => adj.mutate()}
          >
            {adj.isPending ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
        {adj.isError && <p className="text-red-600 text-xs text-center pb-3">Erro ao ajustar estoque</p>}
      </div>
    </div>
  );
}

export function StockPage() {
  const [adjusting, setAdjusting] = useState<StockItem | null>(null);
  const { data: stock = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ['stock'],
    queryFn: () => api.get('/api/stock').then((r) => r.data),
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const low = stock.filter((s) => s.quantity <= s.minQuantity);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          {low.length > 0 && (
            <p className="text-xs text-red-600 mt-0.5 font-semibold">{low.length} item(s) abaixo do estoque mínimo</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-6xl table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th className="text-right">Preço</th>
                <th className="text-center">Qtd</th>
                <th className="text-center">Mín.</th>
                <th className="text-center">Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
              {stock.map((s) => {
                const isLow = s.quantity <= s.minQuantity;
                return (
                  <tr key={s.id}>
                    <td><span className="sku">{s.product.internalCode ?? '—'}</span></td>
                    <td className="font-semibold text-ph-text">{s.product.name}</td>
                    <td className="text-ph-soft text-xs">{(s.product as any).category ?? '—'}</td>
                    <td className="text-right price">{fmt(s.product.price)}</td>
                    <td className="text-center mono font-bold">{s.quantity}</td>
                    <td className="text-center mono text-ph-soft">{s.minQuantity}</td>
                    <td className="text-center">
                      <span className={isLow ? 'badge-red' : 'badge-green'}>
                        {isLow ? 'Crítico' : 'OK'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="btn-secondary btn-sm" onClick={() => setAdjusting(s)}>Ajustar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {adjusting && <AdjustModal item={adjusting} onClose={() => setAdjusting(null)} />}
    </div>
  );
}
