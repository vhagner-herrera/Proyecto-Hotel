import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ReceiptPercentIcon,
  ClockIcon,
  BuildingOfficeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getParametros, updateParametro } from '../../api/admin.api';
import Spinner from '../../components/common/Spinner';

const METADATA_PARAMETROS = {
  IGV_PORCENTAJE: {
    nombre: 'Porcentaje de IGV',
    descripcion: 'Impuesto General a las Ventas aplicado a todas las boletas de pago.',
    categoria: 'Fiscales & Facturación',
    tipo: 'number',
    sugerencia: '18',
  },
  RUC_EMPRESA: {
    nombre: 'RUC del Hotel',
    descripcion: 'Número de RUC legal impreso en los comprobantes y reportes.',
    categoria: 'Fiscales & Facturación',
    tipo: 'text',
    sugerencia: '20601234567',
  },
  RAZON_SOCIAL: {
    nombre: 'Razón Social',
    descripcion: 'Nombre de la razón social registrada legalmente.',
    categoria: 'Fiscales & Facturación',
    tipo: 'text',
    sugerencia: 'HOTEL BONAVENTURA S.A.C.',
  },
  MONEDA_SIMBOLO: {
    nombre: 'Símbolo Monetario',
    descripcion: 'Símbolo de la moneda empleada en precios y cobros.',
    categoria: 'Fiscales & Facturación',
    tipo: 'text',
    sugerencia: 'S/',
  },
  HORA_CHECKIN_ESTANDAR: {
    nombre: 'Hora Oficial de Check-in',
    descripcion: 'Hora por defecto de entrada para huéspedes que alquilan por día.',
    categoria: 'Políticas de Estadía',
    tipo: 'time',
    sugerencia: '14:00',
  },
  HORA_CHECKOUT_ESTANDAR: {
    nombre: 'Hora Límite de Check-out',
    descripcion: 'Hora oficial máxima de salida para evitar horas adicionales.',
    categoria: 'Políticas de Estadía',
    tipo: 'time',
    sugerencia: '12:00',
  },
  MINUTOS_TOLERANCIA_SALIDA: {
    nombre: 'Tolerancia de Salida (Minutos)',
    descripcion: 'Tiempo de gracia concedido al cliente antes de penalidad.',
    categoria: 'Políticas de Estadía',
    tipo: 'number',
    sugerencia: '15',
  },
  DURACION_ESTADIA_HORAS_ESTANDAR: {
    nombre: 'Horas Estándar (Alquiler Rápido)',
    descripcion: 'Duración en horas por defecto para alquiler por horas.',
    categoria: 'Alquiler por Horas',
    tipo: 'number',
    sugerencia: '4',
  },
  TARIFA_HORA_ADICIONAL: {
    nombre: 'Tarifa Hora Extra (S/)',
    descripcion: 'Monto recargado por cada hora adicional sobre la estadía.',
    categoria: 'Alquiler por Horas',
    tipo: 'number',
    sugerencia: '15.00',
  },
  MINUTOS_EXPIRACION_RESERVA: {
    nombre: 'Expiración de Reserva (Minutos)',
    descripcion: 'Tiempo máximo para validar el pago de una reserva en espera.',
    categoria: 'Datos del Hotel',
    tipo: 'number',
    sugerencia: '30',
  },
  DIRECCION_HOTEL: {
    nombre: 'Dirección del Establecimiento',
    descripcion: 'Ubicación física impresa en comprobantes y facturas.',
    categoria: 'Datos del Hotel',
    tipo: 'text',
    sugerencia: 'Av. Principal 123, Lima',
  },
  TELEFONO_RECEPCION: {
    nombre: 'Teléfono / WhatsApp Recepción',
    descripcion: 'Número oficial de contacto con el cliente.',
    categoria: 'Datos del Hotel',
    tipo: 'text',
    sugerencia: '+51 987 654 321',
  },
};

const CATEGORIAS = [
  { id: 'TODAS', label: 'Todos los Parámetros', icon: Cog6ToothIcon },
  { id: 'Fiscales & Facturación', label: 'Fiscales & Facturación', icon: ReceiptPercentIcon },
  { id: 'Políticas de Estadía', label: 'Políticas de Estadía', icon: ClockIcon },
  { id: 'Alquiler por Horas', label: 'Alquiler por Horas', icon: SparklesIcon },
  { id: 'Datos del Hotel', label: 'Datos del Hotel', icon: BuildingOfficeIcon },
];

export default function ParametrosPage() {
  const [parametros, setParametros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(null); // { clave, valor }
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS');

  const fetchParametros = () =>
    getParametros()
      .then((res) => setParametros(res.data))
      .catch(() => toast.error('Error al cargar los parámetros'))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchParametros();
  }, []);

  const handleEdit = (param) => {
    setEditando({ clave: param.clave, valor: param.valor });
  };

  const handleSave = async () => {
    if (!editando?.valor?.trim()) {
      toast.error('El valor del parámetro no puede estar vacío');
      return;
    }
    setSaving(true);
    try {
      await updateParametro(editando.clave, editando.valor);
      toast.success(`Parámetro "${editando.clave}" actualizado correctamente`);
      setEditando(null);
      fetchParametros();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al actualizar el parámetro');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditando(null);
  };

  const parametrosFiltrados = useMemo(() => {
    return parametros.filter((p) => {
      const meta = METADATA_PARAMETROS[p.clave] || {};
      const coincideCategoria =
        categoriaActiva === 'TODAS' || meta.categoria === categoriaActiva;

      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        p.clave.toLowerCase().includes(q) ||
        (meta.nombre && meta.nombre.toLowerCase().includes(q)) ||
        (meta.descripcion && meta.descripcion.toLowerCase().includes(q)) ||
        (p.valor && p.valor.toLowerCase().includes(q));

      return coincideCategoria && coincideBusqueda;
    });
  }, [parametros, categoriaActiva, busqueda]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Parámetros Globales del Sistema</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configuración centralizada de políticas, impuestos, tarifas y datos del hotel
        </p>
      </div>

      {/* Tabs por Categoría */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {CATEGORIAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCategoriaActiva(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              categoriaActiva === id
                ? 'bg-[#1e3a5f] text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por clave, nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm
            focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 shadow-2xs"
        />
      </div>

      {/* Main Table / Grid */}
      <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-5 py-3.5 font-semibold text-gray-700">Parámetro / Descripción</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-700 w-1/4">Clave</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-700 w-1/3">Valor Configurado</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-700 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parametrosFiltrados.length > 0 ? (
                  parametrosFiltrados.map((p) => {
                    const isEditing = editando?.clave === p.clave;
                    const meta = METADATA_PARAMETROS[p.clave] || {
                      nombre: p.clave,
                      descripcion: 'Parámetro de configuración del sistema.',
                      categoria: 'General',
                    };

                    return (
                      <tr key={p.clave} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 text-sm">{meta.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{meta.descripcion}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 font-medium">
                            {p.clave}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editando.valor}
                                onChange={(e) =>
                                  setEditando((prev) => ({ ...prev, valor: e.target.value }))
                                }
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-full px-3 py-1.5 rounded-xl border border-[#1e3a5f] text-sm font-semibold
                                  focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white shadow-2xs"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-gray-900 text-sm bg-blue-50/60 text-blue-950 px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
                              {p.valor}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={handleSave}
                                  disabled={saving}
                                  className="p-2 rounded-xl text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors shadow-2xs"
                                  title="Guardar cambios (Enter)"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditando(null)}
                                  className="p-2 rounded-xl text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                                  title="Cancelar (Esc)"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-2 rounded-xl text-gray-600 bg-gray-100 hover:text-[#1e3a5f] hover:bg-gray-200 transition-colors"
                                title="Editar parámetro"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                      No se encontraron parámetros que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
