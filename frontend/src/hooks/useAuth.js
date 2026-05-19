import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { login as loginApi } from '../api/auth.api';
import { ROLES } from '../utils/constants';

export function useAuth() {
  const navigate = useNavigate();
  const { setUser, setToken, logout: clearAuth } = useAuthStore();

  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    setToken(data.token);
    // El backend devuelve campos planos: { token, nombre, email, rol, ... }
    setUser({ nombre: data.nombre, email: data.email, rol: data.rol });
    navigate(data.rol === ROLES.ADMIN ? '/admin' : '/recepcion');
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return { login, logout };
}
