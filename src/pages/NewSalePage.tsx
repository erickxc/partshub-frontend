import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Plus, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Customer } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export function NewSalePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products-search', search],
    queryFn: () => api.get('/api/products', { params: { search: search || undefined } }).then((r) => r.data),
    enabled: search.length > 1,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => api.get('/api/customers', { params: { search: customerSearch || undefined } }).then((r) => r.data),
    enabled: customerSearch.length > 1,
  });

  const createSale = useMutation({
    mutationFn: (data: any) => api.post('/api/sales', data),
    onSuccess: () => { setSuccess(true); setTimeout(() => navigate('/sales'), 2000); },
  });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, price: product.price }];
    });
    setSearch('');
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.product.id !== id));
    else setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i));
  }

  function updatePrice(id: string, price: number) {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, price } : i));
  }

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = Math.max(0, subtotal - discount);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Venda registrada!</h2>
          <p className="text-gray-500 text-sm mt-1">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-5">Nova Venda</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Cliente (opcional)</h2>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-blue-700">{selectedCustomer.name}</span>
                <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}>Remover</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className="input"
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customers.length > 0 && customerSearch.length > 1 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-40 overflow-y-auto">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                      >
                        {c.name} {c.phone ? `— ${c.phone}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Adicionar Produtos</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Buscar produto por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {products.length > 0 && search.length > 1 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between"
                      onClick={() => addToCart(p)}
                    >
                      <div>
                        <span className="font-medium">{p.name}</span>
                        {p.internalCode && <span className="text-gray-400 ml-2 text-xs">{p.internalCode}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 font-medium">{fmt(p.price)}</span>
                        <span className="text-xs text-gray-400 ml-2">Est: {p.stock?.quantity ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Adicione produtos à venda
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2">Produto</th>
                    <th className="text-center pb-2">Qtd</th>
                    <th className="text-right pb-2">Preço Unit.</th>
                    <th className="text-right pb-2">Subtotal</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cart.map((item) => (
                    <tr key={item.product.id}>
                      <td className="py-2 font-medium">{item.product.name}</td>
                      <td className="py-2 text-center">
                        <input
                          type="number"
                          min="1"
                          className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-sm"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.product.id, Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                          value={item.price}
                          onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 text-right font-medium">{fmt(item.quantity * item.price)}</td>
                      <td className="py-2 pl-2">
                        <button onClick={() => updateQty(item.product.id, 0)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Desconto</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-green-600">{fmt(total)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Observações</h2>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Observações da venda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            className="btn-primary w-full py-3 text-base justify-center"
            disabled={cart.length === 0 || createSale.isPending}
            onClick={() =>
              createSale.mutate({
                customerId: selectedCustomer?.id ?? undefined,
                items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.price })),
                discount,
                notes,
              })
            }
          >
            {createSale.isPending ? 'Registrando...' : `Finalizar Venda — ${fmt(total)}`}
          </button>

          {createSale.isError && (
            <p className="text-red-500 text-xs text-center">
              {(createSale.error as any)?.response?.data?.message ?? 'Erro ao registrar venda'}
            </p>
          )}

          <button className="btn-secondary w-full justify-center" onClick={() => navigate('/sales')}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
