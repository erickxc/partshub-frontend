import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../types';

const CATEGORIES = ['Filtros','Freios','Correias','Ignição','Óleos','Suspensão','Elétrico','Arrefecimento','Palhetas','Injeção','Transmissão','Acessórios','Outros'];

function ProductModal({ product, onClose }: { product?: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    category: (product as any)?.category ?? '',
    internalCode: product?.internalCode ?? '',
    manufacturerCode: product?.manufacturerCode ?? '',
    price: product?.price ?? '',
    cost: product?.cost ?? '',
    unit: (product as any)?.unit ?? 'un',
  });

  const save = useMutation({
    mutationFn: (data: any) =>
      product ? api.put(`/api/products/${product.id}`, data) : api.post('/api/products', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onClose(); },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <h2 className="font-bold text-ph-text">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome do Produto *</label>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Marca</label>
              <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">Selecionar...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Cód. Interno</label>
              <input className="input mono" value={form.internalCode} onChange={(e) => set('internalCode', e.target.value)} />
            </div>
            <div>
              <label className="label">Cód. Fabricante</label>
              <input className="input mono" value={form.manufacturerCode} onChange={(e) => set('manufacturerCode', e.target.value)} />
            </div>
            <div>
              <label className="label">Preço de Venda *</label>
              <input className="input mono" type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div>
              <label className="label">Custo</label>
              <input className="input mono" type="number" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} />
            </div>
            <div>
              <label className="label">Unidade</label>
              <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                {['un','jg','kt','lt','m','kg','par'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary flex-1 justify-center"
            disabled={!form.name || !form.price || save.isPending}
            onClick={() => save.mutate({
              ...form,
              price: Number(form.price),
              cost: form.cost ? Number(form.cost) : undefined,
            })}
          >
            {save.isPending ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
        {save.isError && <p className="text-red-600 text-xs text-center pb-3">Erro ao salvar</p>}
      </div>
    </div>
  );
}

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: () => api.get('/api/products', { params: { search: search || undefined } }).then((r) => r.data),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/api/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <h1 className="page-title">Produtos</h1>
        <button className="btn-primary" onClick={() => setEditing(null)}>
          <Plus className="w-3.5 h-3.5" /> Novo Produto
        </button>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-6xl">
          <div className="px-4 py-3 border-b border-ph-surface-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ph-soft" />
              <input
                className="input pl-9"
                placeholder="Buscar por nome, código ou marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cód. Interno</th>
                  <th>Produto</th>
                  <th>Marca / Cat.</th>
                  <th className="text-right">Preço</th>
                  <th className="text-center">Estoque</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
                {!isLoading && products.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-ph-soft">Nenhum produto encontrado</td></tr>}
                {products.map((p) => {
                  const stock = (p as any).stock;
                  const low = stock && stock.quantity <= stock.minQuantity;
                  return (
                    <tr key={p.id}>
                      <td><span className="sku">{p.internalCode ?? '—'}</span></td>
                      <td className="font-semibold text-ph-text">{p.name}</td>
                      <td>
                        <div className="text-ph-text">{p.brand ?? '—'}</div>
                        {(p as any).category && <div className="text-xs text-ph-soft">{(p as any).category}</div>}
                      </td>
                      <td className="text-right price">{fmt(p.price)}</td>
                      <td className="text-center">
                        <span className={low ? 'badge-red' : 'badge-green'}>
                          {stock?.quantity ?? 0} {(p as any).unit}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn-ghost btn-sm p-1.5 mr-0.5" onClick={() => setEditing(p)}><Pencil className="w-3.5 h-3.5" /></button>
                        <button className="btn-ghost btn-sm p-1.5 text-red-500 hover:text-red-700" onClick={() => { if (confirm('Excluir?')) del.mutate(p.id); }}><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing !== undefined && (
        <ProductModal product={editing ?? undefined} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
