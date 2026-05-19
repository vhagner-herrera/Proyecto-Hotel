import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getHabitaciones } from '../../api/habitaciones.api';
import HabitacionCard from '../../components/recepcion/HabitacionCard';
import FiltroEstados from '../../components/recepcion/FiltroEstados';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-4 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-200" />
      <div className="w-16 h-3 bg-gray-200 rounded" />
      <div className="w-20 h-4 bg-gray-200 rounded" />
      <div className="w-20 h-6 bg-gray-200 rounded-full" />
      <div className="w-full h-8 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('TODAS');

  const fetchHabitaciones = useCallback(async () => {
    try {
      const res = await getHabitaciones();
      setHabitaciones(res.data);
    } catch {
      toast.error('Error al cargar las habitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabitaciones();
    const interval = setInterval(fetchHabitaciones, 30000);
    return () => clearInterval(interval);
  }, [fetchHabitaciones]);

  const filtradas =
    filtro === 'TODAS'
      ? habitaciones
      : habitaciones.filter((h) => h.estado === filtro);

  const disponibles = habitaciones.filter((h) => h.estado === 'DISPONIBLE').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Habitaciones</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {disponibles} disponible{disponibles !== 1 ? 's' : ''} de {habitaciones.length}
          </p>
        </div>
      </div>

      <FiltroEstados estadoActual={filtro} onCambiarEstado={setFiltro} />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay habitaciones con el estado seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtradas.map((h) => (
            <HabitacionCard key={h.id} habitacion={h} />
          ))}
        </div>
      )}
    </div>
  );
}
