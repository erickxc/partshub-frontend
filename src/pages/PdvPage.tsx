import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, CheckCircle, Plus, Minus } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Customer } from '../types';
import { OperationsMenu } from '../components/OperationsMenu';
import { PageHeader } from '../components/PageHeader';

type Mode = 'sale' | 'budget';
interface CartItem { product: Product; quantity: number; price: number; discount: number }
interface Payment { method: string; amount: number }

const METHODS = [
  { id: 'cash', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
  { id: 'debit_card', label: 'Débito' },
  { id: 'credit_card', label: 'Crédito' },
  { id: 'check', label: 'Cheque' },
];

export function PdvPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sale');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [payments, setPayments] = useState<Payment[]>([{ method: 'cash', amount: 0 }]);
  const [validDays, setValidDays] = useState(7);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [showProductDrop, setShowProductDrop] = useState(false);
  const [success, setSuccess] = useState<{ id: string; number: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['pdv-products', productSearch],
    queryFn: () => api.get('/api/products', { params: { search: productSearch || undefined } }).then((r) => r.data),
    enabled: productSearch.length > 1,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['pdv-customers', customerSearch],
    queryFn: () => api.get('/api/customers', { params: { search: customerSearch || undefined } }).then((r) => r.data),
    enabled: customerSearch.length > 1,
  });

  const subtotal = cart.reduce((s, i) => s + i.quantity * (i.price - i.discount), 0);
  const total = Math.max(0, subtotal - discount);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const change = Math.max(0, totalPaid - total);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  function addToCart(p: Product) {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === p.id);
      if (exists) return prev.map((i) => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1, price: Number(p.price), discount: 0 }];
    });
    setProductSearch('');
    setShowProductDrop(false);
    searchRef.current?.focus();
  }

  function updateCart(id: string, field: keyof CartItem, value: number) {
    if (field === 'quantity' && value <= 0) { setCart((p) => p.filter((i) => i.product.id !== id)); return; }
    setCart((p) => p.map((i) => i.product.id === id ? { ...i, [field]: value } : i));
  }

  function setPaymentAmount(method: string, amount: number) {
    setPayments((prev) => {
      const exists = prev.find((p) => p.method === method);
      if (exists) return prev.map((p) => p.method === method ? { ...p, amount } : p).filter((p) => p.amount > 0 || p.method === method);
      return [...prev, { method, amount }];
    });
  }

  function toggleMethod(method: string) {
    setPayments((prev) => {
      const exists = prev.find((p) => p.method === method);
      if (exists) return prev.filter((p) => p.method !== method);
      return [...prev, { method, amount: 0 }];
    });
  }

  const activePayments = payments.filter((p) => p.amount > 0);

  const createSale = useMutation({
    mutationFn: () => api.post('/api/pdv/sales', {
      customerId: selectedCustomer?.id,
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.price, discount: i.discount })),
      payments: activePayments,
      discount,
      notes,
    }),
    onSuccess: (r) => setSuccess({ id: r.data.id, number: r.data.number }),
  });

  const createBudget = useMutation({
    mutationFn: () => api.post('/api/pdv/budgets', {
      customerId: selectedCustomer?.id,
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.price, discount: i.discount })),
      discount,
      notes,
      validDays,
    }),
    onSuccess: (r) => setSuccess({ id: r.data.id, number: r.data.number }),
  });

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-14 h-14 bg-emerald-100 flex items-center justify-center rounded-full">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-ph-text">
            {mode === 'sale' ? 'Venda' : 'Orçamento'} #{String(success.number).padStart(4, '0')} registrado!
          </h2>
          <p className="text-ph-soft text-sm mt-1">Total: {fmt(total)}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => navigate(mode === 'sale' ? '/sales' : '/budgets')}>
            Ver histórico
          </button>
          <button className="btn-primary" onClick={() => { setCart([]); setSuccess(null); setDiscount(0); setNotes(''); setSelectedCustomer(null); setPayments([{ method: 'cash', amount: 0 }]); }}>
            Novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Left: Cart ─── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-ph-border">
        {/* Header */}
        <PageHeader
          breadcrumb={['Operação', 'PDV']}
          title={mode === 'sale' ? 'Ponto de Venda' : 'Novo Orçamento'}
          subtitle="Atalhos: F2 buscar produto · ESC limpar"
          actions={
            <>
              <div className="flex gap-0.5 bg-ph-surface-2 p-0.5 border border-ph-border" style={{ borderRadius: 2 }}>
                {(['sale', 'budget'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${mode === m ? 'bg-white text-ph-text border border-ph-border-2' : 'text-ph-muted hover:text-ph-text'}`}
                    style={{ borderRadius: 2 }}
                  >
                    {m === 'sale' ? 'Venda Direta' : 'Orçamento'}
                  </button>
                ))}
              </div>
              <OperationsMenu onSetMode={(m) => setMode(m)} />
            </>
          }
        />

        {/* Product search */}
        <div className="px-4 py-3 border-b border-ph-border bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ph-soft" />
            <input
              ref={searchRef}
              className="input pl-9"
              placeholder="Buscar produto por nome ou código..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowProductDrop(true); }}
              onFocus={() => setShowProductDrop(true)}
            />
            {showProductDrop && products.length > 0 && productSearch.length > 1 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-ph-border shadow-lg z-20 max-h-56 overflow-y-auto" style={{ borderRadius: '0 0 4px 4px' }}>
                {products.map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-ph-surface-2 flex items-center justify-between gap-4 border-b border-ph-surface-2 last:border-0"
                    onMouseDown={() => addToCart(p)}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-ph-text truncate">{p.name}</div>
                      <div className="flex gap-2 text-xs text-ph-soft">
                        {p.internalCode && <span className="mono">{p.internalCode}</span>}
                        {p.brand && <span>{p.brand}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="price text-sm">{fmt(Number(p.price))}</div>
                      <div className="text-xs text-ph-soft">Est: {(p as any).stock?.quantity ?? 0}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ph-soft gap-2">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">Busque um produto para adicionar</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Produto</th><th className="text-center w-28">Qtd</th><th className="text-right w-32">Preço Unit.</th><th className="text-right w-32">Subtotal</th><th className="w-8"></th></tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product.id}>
                    <td>
                      <div className="font-semibold text-ph-text text-sm">{item.product.name}</div>
                      {item.product.internalCode && <div className="sku">{item.product.internalCode}</div>}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button className="w-6 h-6 flex items-center justify-center border border-ph-border hover:bg-ph-surface-2 text-ph-muted" style={{ borderRadius: 3 }} onClick={() => updateCart(item.product.id, 'quantity', item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number" min="1"
                          className="w-12 text-center border border-ph-border py-0.5 text-sm mono"
                          style={{ borderRadius: 3 }}
                          value={item.quantity}
                          onChange={(e) => updateCart(item.product.id, 'quantity', Number(e.target.value))}
                        />
                        <button className="w-6 h-6 flex items-center justify-center border border-ph-border hover:bg-ph-surface-2 text-ph-muted" style={{ borderRadius: 3 }} onClick={() => updateCart(item.product.id, 'quantity', item.quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number" step="0.01" min="0"
                        className="input mono text-right py-1 text-sm"
                        value={item.price}
                        onChange={(e) => updateCart(item.product.id, 'price', Number(e.target.value))}
                      />
                    </td>
                    <td className="text-right price">{fmt(item.quantity * (item.price - item.discount))}</td>
                    <td><button className="btn-ghost btn-sm p-1 text-red-400 hover:text-red-600" onClick={() => setCart((p) => p.filter((i) => i.product.id !== item.product.id))}><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Right: Summary + Payment ─── */}
      <div className="w-80 flex flex-col overflow-hidden bg-white border-l border-ph-border">
        {/* Customer */}
        <div className="px-4 py-3 border-b border-ph-border">
          <label className="label">Cliente (opcional)</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-ph-surface-2 border border-ph-border px-3 py-2" style={{ borderRadius: 4 }}>
              <div>
                <div className="text-sm font-semibold text-ph-text">{selectedCustomer.name}</div>
                <div className="text-xs text-ph-soft">{selectedCustomer.phone ?? selectedCustomer.document ?? ''}</div>
              </div>
              <button className="text-xs text-ph-accent hover:text-ph-accent-h font-semibold" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}>Trocar</button>
            </div>
          ) : (
            <div className="relative">
              <input className="input" placeholder="Buscar cliente..." value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }} />
              {showCustomerDrop && customers.length > 0 && customerSearch.length > 1 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-ph-border shadow-lg z-20 max-h-40 overflow-y-auto" style={{ borderRadius: 4 }}>
                  {customers.map((c) => (
                    <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-ph-surface-2 text-sm" onMouseDown={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDrop(false); }}>
                      <div className="font-medium text-ph-text">{c.name}</div>
                      <div className="text-xs text-ph-soft">{c.phone ?? c.document ?? ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-b border-ph-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ph-muted">Subtotal</span>
            <span className="mono font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-ph-muted">Desconto (R$)</span>
            <input type="number" min="0" step="0.01" className="input mono text-right py-1 text-sm w-28" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          <div className="flex justify-between font-bold text-lg pt-1 border-t border-ph-border">
            <span>Total</span>
            <span className="price text-xl">{fmt(total)}</span>
          </div>
        </div>

        {/* Payment methods (venda direta) */}
        {mode === 'sale' && (
          <div className="px-4 py-3 border-b border-ph-border">
            <label className="label">Forma de Pagamento</label>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {METHODS.map((m) => {
                const active = payments.some((p) => p.method === m.id);
                return (
                  <button key={m.id} onClick={() => toggleMethod(m.id)} className={active ? 'pay-btn-active text-xs' : 'pay-btn-inactive text-xs'}>
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5">
              {payments.map((p) => (
                <div key={p.method} className="flex items-center gap-2">
                  <span className="text-xs text-ph-muted w-20 truncate">{METHODS.find((m) => m.id === p.method)?.label}</span>
                  <input
                    type="number" min="0" step="0.01"
                    className="input mono text-right py-1 text-sm flex-1"
                    placeholder="0,00"
                    value={p.amount || ''}
                    onChange={(e) => setPaymentAmount(p.method, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-ph-surface-2">
                <span className="text-ph-soft">Troco</span>
                <span className="mono font-bold text-emerald-600">{fmt(change)}</span>
              </div>
            )}
          </div>
        )}

        {/* Budget validity */}
        {mode === 'budget' && (
          <div className="px-4 py-3 border-b border-ph-border">
            <label className="label">Validade do Orçamento</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="90" className="input mono text-center w-20" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
              <span className="text-sm text-ph-muted">dias</span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="px-4 py-3 border-b border-ph-border">
          <label className="label">Observações</label>
          <textarea className="input resize-none text-sm" rows={2} placeholder="Observações..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {/* CTA */}
        <div className="px-4 py-4 mt-auto">
          {mode === 'sale' ? (
            <button
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={cart.length === 0 || createSale.isPending}
              onClick={() => createSale.mutate()}
            >
              {createSale.isPending ? 'Processando...' : `Finalizar Venda — ${fmt(total)}`}
            </button>
          ) : (
            <button
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={cart.length === 0 || createBudget.isPending}
              onClick={() => createBudget.mutate()}
            >
              {createBudget.isPending ? 'Salvando...' : `Gerar Orçamento — ${fmt(total)}`}
            </button>
          )}
          {(createSale.isError || createBudget.isError) && (
            <p className="text-red-600 text-xs text-center mt-2">
              {(createSale.error as any)?.response?.data?.message ?? (createBudget.error as any)?.response?.data?.message ?? 'Erro ao processar'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
