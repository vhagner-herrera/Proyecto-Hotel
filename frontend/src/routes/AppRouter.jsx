import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';

import DashboardRecepcion from '../pages/recepcion/DashboardRecepcion';
import HabitacionesPage from '../pages/recepcion/HabitacionesPage';
import CheckinPage from '../pages/recepcion/CheckinPage';
import ReservasPage from '../pages/recepcion/ReservasPage';

import DashboardAdmin from '../pages/admin/DashboardAdmin';
import HomeAdmin from '../pages/admin/HomeAdmin';
import UsuariosPage from '../pages/admin/UsuariosPage';
import HabitacionesAdminPage from '../pages/admin/HabitacionesAdminPage';
import ReportesIngresosPage from '../pages/admin/ReportesIngresosPage';
import ReporteOcupacionPage from '../pages/admin/ReporteOcupacionPage';
import ParametrosPage from '../pages/admin/ParametrosPage';

import { ROLES } from '../utils/constants';

export default function AppRouter() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
