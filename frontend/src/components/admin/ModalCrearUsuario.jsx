import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createUsuario } from '../../api/admin.api';
import { ROLES } from '../../utils/constants';

const schema = yup.object({
  nombre: yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
  email: yup.string().email('Email inválido').required('Requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('Requerido'),
  rol: yup.string().oneOf(Object.values(ROLES), 'Rol inválido').required('Requerido'),
});

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all ${
    hasError
      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
  }`;
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function ModalCrearUsuario({ isOpen, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await createUsuario(data);
      toast.success('Usuario creado correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al crear el usuario');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Nuevo Usuario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre completo" error={errors.nombre?.message}>
            <input
              {...register('nombre')}
              placeholder="Ej: Juan Pérez"
              className={inputCls(errors.nombre)}
            />
          </Field>

          <Field label="Correo electrónico" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="usuario@hotel.com"
              className={inputCls(errors.email)}
            />
          </Field>

          <Field label="Contraseña" error={errors.password?.message}>
            <input
              {...register('password')}
              type="password"
              placeholder="Mínimo 6 caracteres"
              className={inputCls(errors.password)}
            />
          </Field>

          <Field label="Rol" error={errors.rol?.message}>
            <select {...register('rol')} className={inputCls(errors.rol)}>
              <option value="">Seleccionar rol...</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700
                hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#1e3a5f] hover:bg-[#152b47] disabled:opacity-60 text-white
                text-sm font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
