import { useEffect, useState, useCallback } from 'react';
import {
  HomeIcon,
  CheckCircleIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getReportesOcupacion } from '../../api/admin.api';
import StatsCard from '../../components/admin/StatsCard';
import TablaOcupacion from '../../components/admin/TablaOcupacion';
import Spinner from '../../components/common/Spinner';

function barColor(pct) {
  if (pct >= 70) return 'bg-red-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function ReporteOcupacionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() =>
    getReportesOcupacion()
      .then((res) => setData(res.data))
      .catch(() => toast.error('Error al cargar el reporte de ocupación'))
      .finally(() => setLoading(false)), []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <Spinner />;

  const pct = data?.porcentajeOcupacion ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reporte de Ocupación</h2>
        <p className="text-sm text-gray-500 mt-0.5">Estado actual de las habitaciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Habitaciones"
          value={data?.totalHabitaciones ?? 0}
          icon={HomeIcon}
          color="blue"
        />
        <StatsCard
          title="Disponibles"
          value={data?.disponibles ?? 0}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          title="Ocupadas"
          value={data?.ocupadas ?? 0}
          icon={LockClosedIcon}
          color="red"
        />
        <StatsCard
          title="Mantenimiento"
          value={data?.mantenimiento ?? 0}
          icon={WrenchScrewdriverIcon}
          color="yellow"
        />
      </div>

      {/* Occupancy progress bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Porcentaje de Ocupación</span>
          <span className="text-sm font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {data?.ocupadas ?? 0} de {data?.totalHabitaciones ?? 0} habitaciones ocupadas
        </p>
      </div>

      {/* Table by type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Detalle por Tipo de Habitación</h3>
        </div>
        <TablaOcupacion tipos={data?.porTipo ?? []} />
      </div>
    </div>
  );
}
