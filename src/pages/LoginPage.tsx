import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuth(data.user, data.access_token);
      navigate('/');
    } catch {
      setError('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ph-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ph-accent flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">PartsHub</h1>
            <p className="text-2xs text-ph-soft">Sistema ERP para Autopeças</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-ph-primary-2 border border-ph-primary-3" style={{ padding: '20px' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Acesso ao sistema</h2>

          <div className="space-y-3">
            <div>
              <label className="label text-ph-soft">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark" placeholder="usuario@empresa.com" />
            </div>
            <div>
              <label className="label text-ph-soft">Senha</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-dark" placeholder="••••••••" />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-950/40 border border-red-900 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-4" style={{ height: 36 }}>
              {loading ? 'Autenticando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <p className="text-center text-ph-soft text-2xs mt-4">
          PartsHub v1.0 &nbsp;·&nbsp; Multi-tenant SaaS
        </p>
      </div>
    </div>
  );
}
