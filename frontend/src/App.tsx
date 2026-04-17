import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardHome from './pages/DashboardHome';
import NewFarmPage from './pages/NewFarmPage';
import MachinesPage from './pages/MachinesPage';
import FieldsPage from './pages/FieldsPage';
import CropRotationPage from './pages/CropRotationPage';
import FinancesPage from './pages/FinancesPage';
import StoragePage from './pages/StoragePage';
import AnimalsPage from './pages/AnimalsPage';
import BiogasPage from './pages/BiogasPage';
import TodoPage from './pages/TodoPage';
import MembersPage from './pages/MembersPage';
import ProfilePage from './pages/ProfilePage';
import InvoicesPage from './pages/InvoicesPage';
import FarmSettingsPage from './pages/FarmSettingsPage';
import PriceListPage from './pages/PriceListPage';
import { useAuthStore } from './store/authStore';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' } }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="new-farm" element={<NewFarmPage />} />
          <Route path="machines" element={<MachinesPage />} />
          <Route path="fields" element={<FieldsPage />} />
          <Route path="crop-rotation" element={<CropRotationPage />} />
          <Route path="finances" element={<FinancesPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="animals" element={<AnimalsPage />} />
          <Route path="biogas" element={<BiogasPage />} />
          <Route path="todos" element={<TodoPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="price-list" element={<PriceListPage />} />
          <Route path="settings" element={<FarmSettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
