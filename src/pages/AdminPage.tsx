import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Power, Building2 } from 'lucide-react';
import { api } from '../lib/api';

const PLANS = ['starter', 'pro', 'enterprise'];

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  createdAt: string;
  _count: { users: number };
};

function slugify(v: string) {
  return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function NewTenantModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'starter' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (d: typeof form) => api.post('/api/tenants/register', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); onClose(); },
  });

  const handleNameChange = (v: string) => {
    setForm((f) => ({ ...f, name: v, slug: slugify(v) }));
  };

  const valid = form.name && form.slug && form.adminName && form.adminEmail && form.adminPassword.length >= 6;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ph-border">
          <h2 className="font-bold text-ph-text">Novo Tenant</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Nome da empresa *</label>
            <input className="input" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Auto Peças Silva" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Slug *</label>
              <input className="input mono" value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-pecas-silva" />
            </div>
            <div>
              <label className="label">Plano</label>
              <select className="input" value={form.plan} onChange={(e) => set('plan', e.target.value)}>
                {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <hr className="border-ph-border" />
          <p className="text-xs text-ph-soft font-medium uppercase tracking-wide">Usuário administrador</p>
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.adminName} onChange={(e) => set('adminName', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input className="input" type="password" value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} placeholder="mín. 6 caracteres" />
            </div>
          </div>
          {save.isError && (
            <p className="text-xs text-red-500">{(save.error as any)?.response?.data?.message ?? 'Erro ao criar tenant'}</p>
          )}
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-ph-surface-2">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1 justify-center" disabled={!valid || save.isPending} onClick={() => save.mutate(form)}>
            {save.isPending ? 'Criando...' : 'Criar Tenant'}
          </button>
        </div>
      </div>
    </div>
  );
}

const planBadge: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-50 text-blue-700',
  enterprise: 'bg-amber-50 text-amber-700',
};

export function AdminPage() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();
  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants'],
    queryFn: () => api.get('/api/tenants').then((r) => r.data),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/api/tenants/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  const changePlan = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => api.patch(`/api/tenants/${id}`, { plan }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-ph-soft" />
          <h1 className="page-title">Gestão de Tenants</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5" /> Novo Tenant
        </button>
      </div>

      <div className="flex-1 overflow-y-auto page-body">
        <div className="card max-w-5xl">
          <div className="px-4 py-3 border-b border-ph-surface-2 flex items-center justify-between">
            <span className="text-sm text-ph-soft">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} cadastrado{tenants.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Slug</th>
                  <th>Plano</th>
                  <th>Usuários</th>
                  <th>Criado em</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={7} className="text-center py-8 text-ph-soft">Carregando...</td></tr>
                )}
                {!isLoading && tenants.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-ph-soft">Nenhum tenant cadastrado</td></tr>
                )}
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold text-ph-text">{t.name}</td>
                    <td><span className="sku">{t.slug}</span></td>
                    <td>
                      <select
                        className={`text-xs font-medium px-2 py-0.5 rounded border-0 cursor-pointer ${planBadge[t.plan] ?? 'bg-slate-100 text-slate-600'}`}
                        value={t.plan}
                        onChange={(e) => changePlan.mutate({ id: t.id, plan: e.target.value })}
                      >
                        {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="text-ph-muted">{t._count.users}</td>
                    <td className="text-ph-soft text-xs">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${t.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-green-500' : 'bg-red-400'}`} />
                        {t.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className={`btn-ghost btn-sm p-1.5 ${t.active ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}
                        title={t.active ? 'Desativar' : 'Ativar'}
                        onClick={() => toggle.mutate({ id: t.id, active: !t.active })}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showNew && <NewTenantModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
