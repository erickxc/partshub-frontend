import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Vehicle } from '../types';

function VehicleModal({ vehicle, onClose }: { vehicle?: Vehicle; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ brand: vehicle?.brand ?? '', model: vehicle?.model ?? '', year: vehicle?.year ?? new Date().getFullYear(), engine: vehicle?.engine ?? '' });
  const save = useMutation({
    mutationFn: (d: any) => vehicle ? api.put(`/api/vehicles/${vehicle.id}`, d) : api.post('/api/vehicles', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <h2 className="font-bold">{vehicle ? 'Editar Veículo' : 'Novo Veículo'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Marca *</label><input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
            <div><label className="label">Modelo *</label><input className="input" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
            <div><label className="label">Ano *</label><input className="input mono" type="number" min="1990" max="2025" value={form.year} onChange={(e) => set('year', Number(e.target.value))} /></div>
            <div><label className="label">Motor</label><input className="input mono" value={form.engine} placeholder="ex: 1.0 Turbo" onChange={(e) => set('engine', e.target.value)} /></div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center" disabled={!form.brand || !form.model || save.isPending} onClick={() => save.mutate(form)}>
            {save.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Vehicle | null | undefined>(undefined);
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', search],
    queryFn: () => api.get('/api/vehicles', { params: { search: search || undefined } }).then((r) => r.data),
  });
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div>
          <h1 className="page-title">Veículos</h1>
          <p className="text-xs text-ph-soft mt-0.5">{vehicles.length} veículo(s) cadastrado(s)</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing(null)}><Plus className="w-3.5 h-3.5" /> Novo Veículo</button>
      </div>
      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-5xl">
          <div className="px-4 py-3 border-b border-ph-surface-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ph-soft" />
              <input className="input pl-9" placeholder="Buscar por marca ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Marca</th><th>Modelo</th><th>Ano</th><th>Motor</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="text-center py-8 text-ph-soft">Carregando...</td></tr>}
                {!isLoading && vehicles.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-ph-soft">Nenhum veículo encontrado</td></tr>}
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td className="font-semibold text-ph-text">{v.brand}</td>
                    <td>{v.model}</td>
                    <td><span className="mono">{v.year}</span></td>
                    <td className="text-ph-soft text-xs">{v.engine ?? '—'}</td>
                    <td className="text-right"><button className="btn-ghost btn-sm p-1.5" onClick={() => setEditing(v)}><Pencil className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {editing !== undefined && <VehicleModal vehicle={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
