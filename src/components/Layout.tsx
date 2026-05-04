import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, BarChart3, Users,
  ShoppingCart, LogOut, Wrench, FileText,
  Car, CreditCard,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

const navGroups = [
  {
    label: 'Operação',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/pdv', icon: CreditCard, label: 'PDV / Caixa' },
      { to: '/budgets', icon: FileText, label: 'Orçamentos' },
      { to: '/sales', icon: ShoppingCart, label: 'Vendas' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/products', icon: Package, label: 'Produtos' },
      { to: '/stock', icon: BarChart3, label: 'Estoque' },
      { to: '/customers', icon: Users, label: 'Clientes' },
      { to: '/vehicles', icon: Car, label: 'Veículos' },
    ],
  },
  {
    label: 'Ferramentas',
    items: [
      { to: '/fipe', icon: Wrench, label: 'Tabela FIPE' },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-ph-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col flex-shrink-0 bg-ph-primary border-r border-ph-primary-2">
        {/* Logo */}
        <div className="px-3 py-3 border-b border-ph-primary-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ph-accent flex items-center justify-center flex-shrink-0">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white text-sm leading-tight tracking-tight">
                PartsHub
              </div>
              <div className="text-ph-soft text-2xs mt-0.5 truncate">{user?.tenantName}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
              <div className="px-2 mb-0.5 text-2xs font-semibold uppercase tracking-wider text-ph-soft" style={{ letterSpacing: '0.08em' }}>
                {group.label}
              </div>
              <div>
                {group.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2 text-sm transition-colors duration-100 border-l-2 ${
                        isActive
                          ? 'text-white bg-white/5 border-ph-accent font-medium'
                          : 'text-ph-soft hover:text-white hover:bg-white/[0.03] border-transparent'
                      }`
                    }
                    style={{ paddingTop: 6, paddingBottom: 6 }}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-2 border-t border-ph-primary-2">
          <div className="px-2 py-1">
            <div className="text-xs text-white truncate font-medium">{user?.name ?? user?.email}</div>
            <div className="text-2xs text-ph-soft capitalize">{user?.role}</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2.5 px-2 py-1.5 w-full text-sm text-ph-soft hover:text-white hover:bg-white/[0.03] transition-colors duration-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
