import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { login as loginApi } from '../../api/auth.api';
import { ROLES } from '../../utils/constants';
import { Navigate, useNavigate } from 'react-router-dom';

const schema = yup.object({
  email: yup.string().email('Email inválido').required('El email es requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida'),
});

const ROLE_LABELS = {
  [ROLES.ADMIN]: { label: 'Administrador', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  [ROLES.RECEPCION]: { label: 'Recepcionista', color: 'bg-blue-100 text-blue-800 border-blue-200' },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  // Sesión activa: no tiene sentido mostrar el login
  if (isAuthenticated) {
    return <Navigate to={user?.rol === ROLES.ADMIN ? '/admin' : '/recepcion'} replace />;
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginApi(data);
      const { token, nombre, rol, email, expiresIn } = res.data;
      login({ token, nombre, rol, email, expiresIn });
      toast.success(`Bienvenido, ${nombre}`);
      navigate(rol === ROLES.ADMIN ? '/admin' : '/recepcion');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Credenciales incorrectas';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex" style={{ minHeight: '560px' }}>

        {/* ── Panel izquierdo: formulario ── */}
        <div className="flex-1 px-10 py-12 lg:px-14 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <span className="font-bold text-gray-800 text-base">Hotel Bonaventura</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mb-8">Ingresa con tus credenciales de acceso</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Correo electrónico"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-all
                    ${errors.email
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  {...register('password')}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-lg border text-sm outline-none transition-all
                    ${errors.password
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeSlashIcon className="w-5 h-5" />
                    : <EyeIcon className="w-5 h-5" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-sm font-semibold rounded-lg transition-colors mt-2
                focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          {/* Roles */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-gray-100">
            <span className="text-xs text-gray-400 flex-shrink-0">Acceso para:</span>
            {Object.entries(ROLE_LABELS).map(([rol, { label, color }]) => (
              <span key={rol} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Panel derecho: ilustración ── */}
        <div className="hidden md:flex w-[45%] bg-blue-600 flex-col items-center justify-center relative overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full bg-white/10" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 rounded-full bg-white/10" />
          </div>

          {/* Contenido */}
          <div className="relative z-10 flex flex-col items-center px-10 text-center">
            {/* Ilustración hotel */}
            <svg viewBox="0 0 180 160" className="w-44 h-40 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Edificio */}
              <rect x="30" y="62" width="120" height="98" rx="4" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
              {/* Franja techo */}
              <rect x="20" y="53" width="140" height="13" rx="3" fill="white" fillOpacity="0.25" />
              {/* Ventanas fila 1 */}
              <rect x="44" y="74" width="20" height="14" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="80" y="74" width="20" height="14" rx="2" fill="white" fillOpacity="0.55" />
              <rect x="116" y="74" width="20" height="14" rx="2" fill="white" fillOpacity="0.3" />
              {/* Ventanas fila 2 */}
              <rect x="44" y="100" width="20" height="14" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="80" y="100" width="20" height="14" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="116" y="100" width="20" height="14" rx="2" fill="white" fillOpacity="0.3" />
              {/* Ventanas fila 3 */}
              <rect x="44" y="126" width="20" height="14" rx="2" fill="white" fillOpacity="0.2" />
              <rect x="116" y="126" width="20" height="14" rx="2" fill="white" fillOpacity="0.2" />
              {/* Puerta */}
              <rect x="78" y="124" width="24" height="36" rx="2" fill="white" fillOpacity="0.25" />
              {/* Íconos flotantes */}
              <circle cx="150" cy="48" r="16" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
              <circle cx="30" cy="95" r="14" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
              <circle cx="154" cy="112" r="11" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
            </svg>

            <h2 className="text-white text-xl font-bold leading-snug mb-2">
              Sistema de Gestión<br />Hotelera
            </h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Administra reservas, habitaciones y servicios desde un solo lugar.
            </p>

            {/* Indicadores */}
            <div className="flex items-center gap-2 mt-8">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>

          <p className="absolute bottom-5 text-white/30 text-xs">
            © {new Date().getFullYear()} Hotel Bonaventura
          </p>
        </div>
      </div>
    </div>
  );
}
