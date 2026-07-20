import { create } from 'zustand';

const STORAGE_KEY = 'auth';

/**
 * Lee la sesión guardada en localStorage.
 * localStorage es por navegador: si copias la URL en otro navegador
 * no hay sesión y ProtectedRoute redirige al login.
 * Devuelve null si no existe, está corrupta o el token ya expiró.
 */
function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.token || !session?.user) return null;

    if (session.expiresAt && Date.now() >= session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// Limpieza de la clave antigua (versiones previas guardaban solo 'token')
localStorage.removeItem('token');

const stored = loadSession();

const useAuthStore = create((set) => ({
  user: stored?.user ?? null,
  token: stored?.token ?? null,
  isAuthenticated: !!stored,

  /**
   * Guarda la sesión completa (token + usuario + expiración) en un solo paso,
   * para que sobreviva al refrescar la página.
   * @param expiresIn vida del token en milisegundos (viene del backend)
   */
  login: ({ token, expiresIn, ...user }) => {
    const session = {
      token,
      user,
      expiresAt: expiresIn ? Date.now() + expiresIn : null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
