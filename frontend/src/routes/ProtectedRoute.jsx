import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROLES } from '../utils/constants';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Rol sin permiso para esta sección: enviarlo a su propia área
  if (roles && !roles.includes(user?.rol)) {
    return <Navigate to={user?.rol === ROLES.ADMIN ? '/admin' : '/recepcion'} replace />;
  }

  return children;
}
