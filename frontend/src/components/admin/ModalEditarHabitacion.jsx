import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateHabitacion } from '../../api/habitaciones.api';

const TIPOS = ['SIMPLE', 'DOBLE', 'SUITE'];
const ESTADOS_EDITABLES = ['DISPONIBLE', 'MANTENIMIENTO'];

const schema = yup.object({
  tipo: yup.string().oneOf(TIPOS, 'Tipo inválido').required('Requerido'),
  precioPorNoche: yup
    .number()
    .typeError('Debe ser un número')
    .min(0.01, 'El precio debe ser mayor a 0')
    .required('Requerido'),
  estado: yup.string().oneOf(ESTADOS_EDITABLES, 'Estado inválido').required('Requerido'),
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

export default function ModalEditarHabitacion({ isOpen, onClose, habitacion, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (isOpen && habitacion) {
      const estadoEditable = ESTADOS_EDITABLES.includes(habitacion.estado)
        ? habitacion.estado
        : 'DISPONIBLE';
      reset({
        tipo: habitacion.tipo,
        precioPorNoche: habitacion.precioPorNoche,
        estado: estadoEditable,
      });
    }
  }, [isOpen, habitacion, reset]);

  const onSubmit = async (data) => {
    try {
      await updateHabitacion(habitacion.id, data);
      toast.success('Habitación actualizada correctamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar la habitación');
    }
  };

  if (!isOpen || !habitacion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Editar Habitación</h3>
            <p className="text-xs text-gray-500 mt-0.5">Habitación N° {habitacion.numero}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {habitacion.estado === 'OCUPADA' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 font-medium">
              Esta habitación está ocupada. Solo puedes modificar tipo y precio; el estado cambiará a DISPONIBLE al guardar.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Tipo" error={errors.tipo?.message}>
            <select {...register('tipo')} className={inputCls(errors.tipo)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Precio por noche (S/)" error={errors.precioPorNoche?.message}>
            <input
              {...register('precioPorNoche')}
              type="number"
              step="0.01"
              min="0.01"
              className={inputCls(errors.precioPorNoche)}
            />
          </Field>

          <Field label="Estado" error={errors.estado?.message}>
            <select {...register('estado')} className={inputCls(errors.estado)}>
              {ESTADOS_EDITABLES.map((e) => (
                <option key={e} value={e}>{e}</option>
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
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
