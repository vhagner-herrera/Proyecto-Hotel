import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import { login as loginApi } from '../../api/auth.api';
import { ROLES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

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
  const { setUser, setToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginApi(data);
      const { token, nombre, rol, email } = res.data;
      setToken(token);
      setUser({ nombre, rol, email });
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
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#152b47] flex items-center justify-center p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
            <BuildingOffice2Icon className="w-9 h-9 text-[#c9a84c]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Hotel Bonaventura</h1>
          <p className="text-white/60 mt-1 text-sm">Sistema de gestión hotelera</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresa con tus credenciales de acceso</p>

          {/* Roles info */}
          <div className="flex gap-2 mb-6">
            {Object.entries(ROLE_LABELS).map(([rol, { label, color }]) => (
              <span key={rol} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
                {label}
              </span>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="usuario@hotel.com"
                {...register('email')}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all
                  ${errors.email
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
                  }`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full px-4 py-2.5 pr-11 rounded-lg border text-sm outline-none transition-all
                    ${errors.password
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
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
              className="w-full py-2.5 px-4 bg-[#1e3a5f] hover:bg-[#152b47] disabled:opacity-60
                text-white text-sm font-semibold rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/50 mt-2"
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
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © {new Date().getFullYear()} Hotel Bonaventura — Acceso restringido
        </p>
      </div>
    </div>
  );
}
