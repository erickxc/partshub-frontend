import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockPage } from './pages/StockPage';
import { CustomersPage } from './pages/CustomersPage';
import { SalesPage } from './pages/SalesPage';
import { PdvPage } from './pages/PdvPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { FipePage } from './pages/FipePage';
import { VehiclesPage } from './pages/VehiclesPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="pdv" element={<PdvPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="fipe" element={<FipePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
