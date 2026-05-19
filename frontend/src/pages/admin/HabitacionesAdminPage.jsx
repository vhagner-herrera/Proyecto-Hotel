import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { getHabitaciones, deleteHabitacion } from '../../api/habitaciones.api';
import { formatMoneda } from '../../utils/formatters';
import ModalCrearHabitacion from '../../components/admin/ModalCrearHabitacion';
import ModalEditarHabitacion from '../../components/admin/ModalEditarHabitacion';

const ESTADO_BADGE = {
  DISPONIBLE:   'bg-green-100 text-green-700',
  OCUPADA:      'bg-red-100 text-red-700',
  MANTENIMIENTO:'bg-yellow-100 text-yellow-700',
};

const TIPO_BADGE = {
  SIMPLE: 'bg-blue-50 text-blue-700',
  DOBLE:  'bg-indigo-50 text-indigo-700',
  SUITE:  'bg-purple-50 text-purple-700',
};

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-7 w-7 text-[#1e3a5f]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function ResumenBadge({ label, count, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${color}`}>
      <span className="text-lg font-bold">{count}</span>
      <span>{label}</span>
    </div>
  );
}

export default function HabitacionesAdminPage() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [habitacionEditar, setHabitacionEditar] = useState(null);

  const fetchHabitaciones = async () => {
    try {
      const res = await getHabitaciones();
      setHabitaciones(res.data);
    } catch {
      toast.error('Error al cargar las habitaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHabitaciones(); }, []);

  const handleDelete = async (hab) => {
    if (!confirm(`¿Eliminar la habitación N° ${hab.numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteHabitacion(hab.id);
      toast.success(`Habitación ${hab.numero} eliminada`);
      fetchHabitaciones();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al eliminar la habitación');
    }
  };

  const disponibles   = habitaciones.filter((h) => h.estado === 'DISPONIBLE').length;
  const ocupadas      = habitaciones.filter((h) => h.estado === 'OCUPADA').length;
  const mantenimiento = habitaciones.filter((h) => h.estado === 'MANTENIMIENTO').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Habitaciones</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {habitaciones.length} habitación{habitaciones.length !== 1 ? 'es' : ''} registrada{habitaciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#152b47] text-white
            text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nueva Habitación
        </button>
      </div>

      {/* Summary strip */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          <ResumenBadge label="Disponibles"    count={disponibles}   color="bg-green-50 text-green-700" />
          <ResumenBadge label="Ocupadas"       count={ocupadas}      color="bg-red-50 text-red-700" />
          <ResumenBadge label="Mantenimiento"  count={mantenimiento} color="bg-yellow-50 text-yellow-700" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <Spinner />
        ) : habitaciones.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm">
            No hay habitaciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20">N°</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Precio / noche</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {habitaciones.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900 text-base">{h.numero}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_BADGE[h.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                        {h.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatMoneda(h.precioPorNoche)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[h.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {h.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setHabitacionEditar(h)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(h)}
                          disabled={h.estado === 'OCUPADA'}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50
                            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={h.estado === 'OCUPADA' ? 'No se puede eliminar (ocupada)' : 'Eliminar'}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalCrearHabitacion
        isOpen={modalCrear}
        onClose={() => setModalCrear(false)}
        onSuccess={fetchHabitaciones}
      />
      <ModalEditarHabitacion
        isOpen={!!habitacionEditar}
        onClose={() => setHabitacionEditar(null)}
        habitacion={habitacionEditar}
        onSuccess={fetchHabitaciones}
      />
    </div>
  );
}
