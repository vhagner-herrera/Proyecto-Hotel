import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Spinner from '../components/common/Spinner';
import LoginPage from '../pages/auth/LoginPage';
import { ROLES } from '../utils/constants';

// Code-splitting por ruta: cada página se descarga solo cuando se visita,
// lo que reduce el bundle inicial y acelera la primera carga.
const DashboardRecepcion = lazy(() => import('../pages/recepcion/DashboardRecepcion'));
const HabitacionesPage = lazy(() => import('../pages/recepcion/HabitacionesPage'));
const CheckinPage = lazy(() => import('../pages/recepcion/CheckinPage'));
const ReservasPage = lazy(() => import('../pages/recepcion/ReservasPage'));

const DashboardAdmin = lazy(() => import('../pages/admin/DashboardAdmin'));
const HomeAdmin = lazy(() => import('../pages/admin/HomeAdmin'));
const UsuariosPage = lazy(() => import('../pages/admin/UsuariosPage'));
const HabitacionesAdminPage = lazy(() => import('../pages/admin/HabitacionesAdminPage'));
const ReportesIngresosPage = lazy(() => import('../pages/admin/ReportesIngresosPage'));
const ReporteOcupacionPage = lazy(() => import('../pages/admin/ReporteOcupacionPage'));
const ParametrosPage = lazy(() => import('../pages/admin/ParametrosPage'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spinner size="xl" className="h-screen" />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* ── RECEPCIÓN ── */}
          <Route
            path="/recepcion"
            element={
              <ProtectedRoute roles={[ROLES.RECEPCION, ROLES.ADMIN]}>
                <DashboardRecepcion />
              </ProtectedRoute>
            }
          >
            <Route index element={<HabitacionesPage />} />
            <Route path="checkin/:idHabitacion" element={<CheckinPage />} />
            <Route path="reservas" element={<ReservasPage />} />
          </Route>

          {/* ── ADMIN ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeAdmin />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="habitaciones" element={<HabitacionesAdminPage />} />
            <Route path="reportes/ingresos" element={<ReportesIngresosPage />} />
            <Route path="reportes/ocupacion" element={<ReporteOcupacionPage />} />
            <Route path="reportes" element={<Navigate to="/admin/reportes/ingresos" replace />} />
            <Route path="parametros" element={<ParametrosPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
