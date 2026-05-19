import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getHabitacion } from '../../api/habitaciones.api';
import { consultarDni, procesarCheckin } from '../../api/reservas.api';
import useAuthStore from '../../store/authStore';
import ResumenReserva from '../../components/recepcion/ResumenReserva';
import ConfirmacionModal from '../../components/recepcion/ConfirmacionModal';

const schema = yup.object({
  tipoDocumento: yup.string().oneOf(['DNI', 'CARNET_EXTRANJERIA']).required(),
  clienteDocumento: yup
    .string()
    .required('El número de documento es requerido')
    .when('tipoDocumento', {
      is: 'DNI',
      then: (s) => s.matches(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos'),
      otherwise: (s) => s.max(15, 'Máximo 15 caracteres'),
    }),
  clienteNombreCompleto: yup
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .required('El nombre es requerido'),
  clienteEdad: yup
    .number()
    .typeError('Debe ser un número')
    .min(1, 'Mínimo 1')
    .max(120, 'Máximo 120')
    .required('La edad es requerida'),
  clienteCelular: yup
    .string()
    .matches(/^[0-9]{9,15}$/, 'El celular debe tener entre 9 y 15 dígitos')
    .required('El celular es requerido'),
  cantidadNoches: yup
    .number()
    .typeError('Debe ser un número')
    .min(1, 'Mínimo 1 noche')
    .required('La cantidad de noches es requerida'),
  metodoPago: yup
    .string()
    .oneOf(['EFECTIVO', 'TARJETA'], 'Selecciona un método de pago')
    .required('El método de pago es requerido'),
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

function SectionTitle({ children }) {
  return (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
      {children}
    </h3>
  );
}

export default function CheckinPage() {
  const { idHabitacion } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [habitacion, setHabitacion] = useState(null);
  const [loadingHab, setLoadingHab] = useState(true);
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [dniConsultado, setDniConsultado] = useState(false);
  const [reservaCreada, setReservaCreada] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipoDocumento: 'DNI',
      cantidadNoches: 1,
      metodoPago: 'EFECTIVO',
    },
  });

  const tipoDocumento = watch('tipoDocumento');
  const cantidadNoches = watch('cantidadNoches');
  const clienteDocumento = watch('clienteDocumento');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getHabitacion(idHabitacion);
        if (res.data.estado !== 'DISPONIBLE') {
          toast.error('Esta habitación ya no está disponible');
          navigate('/recepcion');
          return;
        }
        setHabitacion(res.data);
      } catch {
        toast.error('No se pudo cargar la habitación');
        navigate('/recepcion');
      } finally {
        setLoadingHab(false);
      }
    };
    fetch();
  }, [idHabitacion, navigate]);

  // Reset nombre y flag cuando cambia tipo de documento
  useEffect(() => {
    setValue('clienteDocumento', '');
    setValue('clienteNombreCompleto', '');
    setDniConsultado(false);
  }, [tipoDocumento, setValue]);

  const handleConsultarDni = async () => {
    if (!clienteDocumento?.match(/^\d{8}$/)) {
      toast.error('Ingresa un DNI válido de 8 dígitos');
      return;
    }
    setBuscandoDni(true);
    try {
      const res = await consultarDni(clienteDocumento);
      setValue('clienteNombreCompleto', res.data.nombreCompleto, { shouldValidate: true });
      setDniConsultado(true);
      toast.success(`DNI encontrado: ${res.data.nombreCompleto}`);
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'DNI no encontrado en RENIEC';
      toast.error(msg);
      setValue('clienteNombreCompleto', '');
      setDniConsultado(false);
    } finally {
      setBuscandoDni(false);
    }
  };

  const onSubmit = async (data) => {
    if (tipoDocumento === 'DNI' && !dniConsultado) {
      toast.error('Debes consultar el DNI en RENIEC antes de continuar');
      return;
    }
    try {
      const payload = {
        idHabitacion: habitacion.id,
        numeroHabitacion: habitacion.numero,
        tipoHabitacion: habitacion.tipo,
        precioPorNoche: habitacion.precioPorNoche,
        tipoDocumento: data.tipoDocumento,
        clienteDocumento: data.clienteDocumento,
        clienteNombreCompleto: data.clienteNombreCompleto,
        clienteEdad: data.clienteEdad,
        clienteCelular: data.clienteCelular,
        cantidadNoches: data.cantidadNoches,
        metodoPago: data.metodoPago,
      };
      const res = await procesarCheckin(payload, user?.email);
      toast.success('¡Reserva creada exitosamente!');
      setReservaCreada(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al procesar el check-in');
    }
  };

  const handleCancelar = () => {
    if (confirm('¿Seguro que deseas cancelar? Los datos ingresados se perderán.')) {
      navigate('/recepcion');
    }
  };

  if (loadingHab) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-[#1e3a5f]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/recepcion')}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Check-in</h2>
            <p className="text-sm text-gray-500">
              Habitación N° {habitacion?.numero} — {habitacion?.tipo}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: form */}
            <div className="lg:col-span-2 space-y-5">

              {/* PASO 1: Documento */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <SectionTitle>Paso 1 — Datos del Cliente</SectionTitle>

                {/* Tipo documento radio */}
                <div className="flex gap-6 mb-5">
                  {[
                    { value: 'DNI', label: 'DNI' },
                    { value: 'CARNET_EXTRANJERIA', label: 'Carnet de Extranjería' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        value={value}
                        {...register('tipoDocumento')}
                        className="accent-[#1e3a5f] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {tipoDocumento === 'DNI' ? (
                  <div className="space-y-4">
                    <Field label="Número de DNI" error={errors.clienteDocumento?.message}>
                      <div className="flex gap-2">
                        <input
                          {...register('clienteDocumento')}
                          maxLength={8}
                          placeholder="12345678"
                          className={inputCls(errors.clienteDocumento)}
                          onChange={(e) => {
                            register('clienteDocumento').onChange(e);
                            setDniConsultado(false);
                            setValue('clienteNombreCompleto', '');
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleConsultarDni}
                          disabled={buscandoDni}
                          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#1e3a5f]
                            hover:bg-[#152b47] disabled:opacity-60 text-white text-sm font-semibold
                            rounded-lg transition-colors whitespace-nowrap"
                        >
                          {buscandoDni ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                          ) : (
                            <MagnifyingGlassIcon className="w-4 h-4" />
                          )}
                          Consultar RENIEC
                        </button>
                      </div>
                    </Field>

                    <Field label="Nombre completo" error={errors.clienteNombreCompleto?.message}>
                      <input
                        {...register('clienteNombreCompleto')}
                        disabled={dniConsultado}
                        placeholder={dniConsultado ? '' : 'Consulta el DNI primero'}
                        className={`${inputCls(errors.clienteNombreCompleto)} ${dniConsultado ? 'bg-green-50 border-green-300 text-green-800 cursor-not-allowed' : ''}`}
                      />
                      {dniConsultado && (
                        <p className="mt-1 text-xs text-green-600">Obtenido de RENIEC</p>
                      )}
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Field label="Número de documento" error={errors.clienteDocumento?.message}>
                      <input
                        {...register('clienteDocumento')}
                        maxLength={15}
                        placeholder="Nro. de carnet de extranjería"
                        className={inputCls(errors.clienteDocumento)}
                      />
                    </Field>
                    <Field label="Nombre completo" error={errors.clienteNombreCompleto?.message}>
                      <input
                        {...register('clienteNombreCompleto')}
                        placeholder="Nombre completo del huésped"
                        className={inputCls(errors.clienteNombreCompleto)}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* PASO 2: Datos adicionales */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <SectionTitle>Paso 2 — Datos Adicionales</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Edad" error={errors.clienteEdad?.message}>
                    <input
                      {...register('clienteEdad')}
                      type="number"
                      min={1}
                      max={120}
                      placeholder="18"
                      className={inputCls(errors.clienteEdad)}
                    />
                  </Field>
                  <Field label="Celular" error={errors.clienteCelular?.message}>
                    <input
                      {...register('clienteCelular')}
                      type="tel"
                      maxLength={15}
                      placeholder="912345678"
                      className={inputCls(errors.clienteCelular)}
                    />
                  </Field>
                  <Field label="Cantidad de noches" error={errors.cantidadNoches?.message}>
                    <input
                      {...register('cantidadNoches')}
                      type="number"
                      min={1}
                      placeholder="1"
                      className={inputCls(errors.cantidadNoches)}
                    />
                  </Field>
                </div>
              </div>

              {/* PASO 3: Método de pago */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <SectionTitle>Paso 3 — Método de Pago</SectionTitle>
                <div className="flex gap-6">
                  {[
                    { value: 'EFECTIVO', label: 'Efectivo' },
                    { value: 'TARJETA', label: 'Tarjeta' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        value={value}
                        {...register('metodoPago')}
                        className="accent-[#1e3a5f] w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
                {errors.metodoPago && (
                  <p className="mt-2 text-xs text-red-600">{errors.metodoPago.message}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold
                    text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60
                    text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {isSubmitting
                    ? 'Procesando...'
                    : 'Procesar Check-in y Emitir Boleta'}
                </button>
              </div>
            </div>

            {/* Right column: summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                {habitacion && (
                  <ResumenReserva habitacion={habitacion} cantidadNoches={cantidadNoches} />
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <ConfirmacionModal isOpen={!!reservaCreada} reserva={reservaCreada} />
    </>
  );
}
