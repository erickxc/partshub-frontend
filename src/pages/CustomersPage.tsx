import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Customer } from '../types';

function CustomerModal({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: customer?.name ?? '', document: customer?.document ?? '', phone: customer?.phone ?? '', email: customer?.email ?? '', address: (customer as any)?.address ?? '' });
  const save = useMutation({
    mutationFn: (d: any) => customer ? api.put(`/api/customers/${customer.id}`, d) : api.post('/api/customers', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); onClose(); },
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <h2 className="font-bold text-ph-text">{customer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">CPF/CNPJ</label><input className="input mono" value={form.document} onChange={(e) => set('document', e.target.value)} /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          </div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">Endereço</label><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center" disabled={!form.name || save.isPending} onClick={() => save.mutate(form)}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined);
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers', search],
    queryFn: () => api.get('/api/customers', { params: { search: search || undefined } }).then((r) => r.data),
  });
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <button className="btn-primary" onClick={() => setEditing(null)}><Plus className="w-3.5 h-3.5" /> Novo Cliente</button>
      </div>
      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-5xl">
          <div className="px-4 py-3 border-b border-ph-surface-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ph-soft" />
              <input className="input pl-9" placeholder="Buscar por nome, CPF ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Telefone</th><th>Email</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
                {!isLoading && customers.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-ph-soft">Nenhum cliente encontrado</td></tr>}
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold text-ph-text">{c.name}</td>
                    <td><span className="sku">{c.document ?? '—'}</span></td>
                    <td className="text-ph-muted">{c.phone ?? '—'}</td>
                    <td className="text-ph-soft text-xs">{c.email ?? '—'}</td>
                    <td className="text-right"><button className="btn-ghost btn-sm p-1.5" onClick={() => setEditing(c)}><Pencil className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {editing !== undefined && <CustomerModal customer={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
