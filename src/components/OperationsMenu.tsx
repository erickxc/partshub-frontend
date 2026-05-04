import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, RefreshCw, Undo2, ShoppingCart, FileText,
  Sun, Lock, Unlock, X, AlertTriangle, CheckCircle, ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

// ──────────────────────────────────────────────────────────────────
// MODAL: Abrir caixa
// ──────────────────────────────────────────────────────────────────
function OpenCashModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [opening, setOpening] = useState('');
  const [notes, setNotes] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/api/pdv/cash-register/open', { openingBalance: Number(opening), notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash-current'] }); onClose(); },
  });
  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-sm">
        <div className="modal-header">
          <h3 className="font-semibold">Abertura de Caixa</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="modal-body space-y-3">
          <div>
            <label className="label">Saldo de abertura (fundo de troco)</label>
            <input type="number" min="0" step="0.01" className="input mono text-right" placeholder="0,00" value={opening} onChange={(e) => setOpening(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Observações</label>
            <input className="input" placeholder="Operador, turno..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {m.isError && <p className="text-ph-danger text-xs">{(m.error as any)?.response?.data?.message ?? 'Erro'}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!opening || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? 'Abrindo...' : 'Abrir Caixa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MODAL: Fechar caixa
// ──────────────────────────────────────────────────────────────────
function CloseCashModal({ current, onClose }: { current: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [closing, setClosing] = useState('');
  const [notes, setNotes] = useState('');
  const m = useMutation({
    mutationFn: () => api.post('/api/pdv/cash-register/close', { closingBalance: Number(closing), notes }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['cash-current'] }); /* podemos exibir resumo aqui */ onClose(); },
  });
  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-sm">
        <div className="modal-header">
          <h3 className="font-semibold">Fechamento de Caixa</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="modal-body space-y-3">
          <div className="bg-ph-surface-2 border border-ph-border px-3 py-2 text-xs">
            <div className="flex justify-between"><span className="text-ph-muted">Aberto em</span><span className="mono">{new Date(current.openedAt).toLocaleString('pt-BR')}</span></div>
            <div className="flex justify-between mt-1"><span className="text-ph-muted">Saldo abertura</span><span className="mono">{fmt(Number(current.openingBalance))}</span></div>
          </div>
          <div>
            <label className="label">Saldo final (contagem física)</label>
            <input type="number" min="0" step="0.01" className="input mono text-right" placeholder="0,00" value={closing} onChange={(e) => setClosing(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Observações</label>
            <input className="input" placeholder="Quebra, sangria, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {m.isError && <p className="text-ph-danger text-xs">{(m.error as any)?.response?.data?.message ?? 'Erro'}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!closing || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? 'Fechando...' : 'Fechar Caixa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MODAL: Estornar venda
// ──────────────────────────────────────────────────────────────────
function CancelSaleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState('');

  const { data: sales = [] } = useQuery<any[]>({
    queryKey: ['recent-sales'],
    queryFn: () => api.get('/api/pdv/sales').then((r) => r.data),
  });

  const filtered = sales.filter((s: any) =>
    s.status !== 'cancelled' && (
      String(s.number).includes(search) ||
      s.customer?.name?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const cancel = useMutation({
    mutationFn: () => api.post(`/api/pdv/sales/${selected.id}/cancel`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recent-sales'] }); qc.invalidateQueries({ queryKey: ['sales'] }); onClose(); },
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md">
        <div className="modal-header">
          <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-ph-warning" /> Estornar Venda</h3>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="modal-body space-y-3">
          {!selected ? (
            <>
              <input className="input" placeholder="Buscar por número ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
              <div className="border border-ph-border max-h-64 overflow-y-auto">
                {filtered.length === 0 && <div className="px-3 py-6 text-center text-xs text-ph-soft">Nenhuma venda encontrada</div>}
                {filtered.slice(0, 20).map((s: any) => (
                  <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-ph-surface-2 border-b border-ph-border last:border-0 flex items-center justify-between" onClick={() => setSelected(s)}>
                    <div>
                      <div className="text-sm font-medium">#{String(s.number).padStart(4, '0')} — {s.customer?.name ?? 'Avulso'}</div>
                      <div className="text-2xs text-ph-soft mono">{new Date(s.createdAt).toLocaleString('pt-BR')}</div>
                    </div>
                    <div className="price text-sm">{fmt(Number(s.total))}</div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bg-ph-warning-l border border-yellow-300 px-3 py-2 text-xs">
                <div className="font-semibold text-ph-warning mb-1">Atenção: o estoque dos produtos será restaurado.</div>
                <div className="flex justify-between"><span>Venda</span><span className="mono">#{String(selected.number).padStart(4, '0')}</span></div>
                <div className="flex justify-between"><span>Cliente</span><span>{selected.customer?.name ?? 'Avulso'}</span></div>
                <div className="flex justify-between"><span>Total</span><span className="mono font-semibold">{fmt(Number(selected.total))}</span></div>
              </div>
              <div>
                <label className="label">Motivo do estorno</label>
                <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Erro de operação, devolução, etc." autoFocus />
              </div>
              {cancel.isError && <p className="text-ph-danger text-xs">{(cancel.error as any)?.response?.data?.message ?? 'Erro'}</p>}
            </>
          )}
        </div>
        <div className="modal-footer">
          {selected && <button className="btn-ghost" onClick={() => setSelected(null)}>Voltar</button>}
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          {selected && (
            <button className="btn-danger" disabled={!reason || cancel.isPending} onClick={() => cancel.mutate()}>
              {cancel.isPending ? 'Estornando...' : 'Confirmar Estorno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MENU
// ──────────────────────────────────────────────────────────────────

interface Props {
  onSetMode?: (m: 'sale' | 'budget') => void;
}

export function OperationsMenu({ onSetMode }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | 'open-cash' | 'close-cash' | 'cancel'>(null);
  const ref = useRef<HTMLDivElement>(null);

  const { data: cashCurrent } = useQuery<any>({
    queryKey: ['cash-current'],
    queryFn: () => api.get('/api/pdv/cash-register/current').then((r) => r.data),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isCashOpen = !!cashCurrent;

  function handle(action: string) {
    setOpen(false);
    if (action === 'sale') onSetMode?.('sale');
    if (action === 'budget') onSetMode?.('budget');
    if (action === 'budgets-list') navigate('/budgets');
    if (action === 'open-cash') setModal('open-cash');
    if (action === 'close-cash') setModal('close-cash');
    if (action === 'cancel') setModal('cancel');
    if (action === 'return') alert('Devolução parcial — em breve');
    if (action === 'open-day') alert('Abertura de movimento do dia — em breve');
  }

  return (
    <div ref={ref} className="relative">
      <button className="btn-secondary" onClick={() => setOpen(!open)}>
        Operações
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="dropdown-menu">
          {/* Status do caixa */}
          <div className="px-3 py-2 border-b border-ph-border bg-ph-surface-2 text-2xs">
            <div className="flex items-center justify-between">
              <span className="text-ph-soft uppercase tracking-wider font-semibold">Caixa</span>
              <span className={isCashOpen ? 'badge-green' : 'badge-gray'}>
                {isCashOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            {isCashOpen && (
              <div className="mt-1 text-ph-muted mono">
                Saldo: {fmt(Number(cashCurrent.openingBalance))}
              </div>
            )}
          </div>

          {/* Vendas */}
          <div className="dropdown-section">
            <div className="dropdown-section-label">Vendas</div>
            <button className="dropdown-item" onClick={() => handle('sale')}>
              <ShoppingCart className="w-3.5 h-3.5 text-ph-muted" />
              Efetuar venda
            </button>
            <button className="dropdown-item" onClick={() => handle('budget')}>
              <FileText className="w-3.5 h-3.5 text-ph-muted" />
              Abrir orçamento
            </button>
            <button className="dropdown-item" onClick={() => handle('budgets-list')}>
              <ArrowRight className="w-3.5 h-3.5 text-ph-muted" />
              Converter orçamento aprovado
            </button>
          </div>

          {/* Pós-venda */}
          <div className="dropdown-section">
            <div className="dropdown-section-label">Pós-venda</div>
            <button className="dropdown-item dropdown-item-danger" onClick={() => handle('cancel')}>
              <RefreshCw className="w-3.5 h-3.5" />
              Estornar venda
            </button>
            <button className="dropdown-item" onClick={() => handle('return')}>
              <Undo2 className="w-3.5 h-3.5 text-ph-muted" />
              Devolução parcial
            </button>
          </div>

          {/* Caixa */}
          <div className="dropdown-section">
            <div className="dropdown-section-label">Movimento</div>
            <button className="dropdown-item" onClick={() => handle('open-day')}>
              <Sun className="w-3.5 h-3.5 text-ph-muted" />
              Abrir o dia
            </button>
            <button className="dropdown-item" onClick={() => handle('open-cash')} disabled={isCashOpen}>
              <Unlock className="w-3.5 h-3.5 text-ph-muted" />
              Abrir caixa
            </button>
            <button className="dropdown-item" onClick={() => handle('close-cash')} disabled={!isCashOpen}>
              <Lock className="w-3.5 h-3.5 text-ph-muted" />
              Fechar caixa
            </button>
          </div>
        </div>
      )}

      {modal === 'open-cash' && <OpenCashModal onClose={() => setModal(null)} />}
      {modal === 'close-cash' && cashCurrent && <CloseCashModal current={cashCurrent} onClose={() => setModal(null)} />}
      {modal === 'cancel' && <CancelSaleModal onClose={() => setModal(null)} />}
    </div>
  );
}
