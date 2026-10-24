import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/CatalogPage';
import { RecipesPage } from './pages/RecipesPage';
import { ProductionPage } from './pages/ProductionPage';
import { ClosuresPage } from './pages/ClosuresPage';
import { TransfersPage } from './pages/TransfersPage';
import { WastePage } from './pages/WastePage';
import { InventoryPage } from './pages/InventoryPage';
import { UsersPage } from './pages/UsersPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'production', element: <ProductionPage /> },
      { path: 'closures', element: <ClosuresPage /> },
      { path: 'transfers', element: <TransfersPage /> },
      { path: 'waste', element: <WastePage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'users', element: <UsersPage /> },
    ],
  },
]);
