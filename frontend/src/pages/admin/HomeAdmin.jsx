import { useEffect, useState, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  CalendarDaysIcon,
  HomeIcon,
  LockClosedIcon,
  UsersIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/admin/StatsCard';
import { getDashboard } from '../../api/admin.api';
import { formatMoneda } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

export default function HomeAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(() =>
    getDashboard()
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false)), []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="" />
          <span className="text-sm text-gray-500">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-sm text-[#1e3a5f] hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const extra = [
    {
      label: 'Porcentaje Ocupación',
      value: `${Number(data?.porcentajeOcupacion ?? 0).toFixed(1)}%`,
      icon: HomeIcon,
      cls: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Usuarios Activos',
      value: data?.usuariosActivos ?? 0,
      icon: UsersIcon,
      cls: 'text-green-600 bg-green-50',
    },
    {
      label: 'Boletas Emitidas',
      value: data?.boletasEmitidas ?? 0,
      icon: DocumentTextIcon,
      cls: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Promedio Diario',
      value: formatMoneda(data?.promedioDiario ?? 0),
      icon: BanknotesIcon,
      cls: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Ingresos del Mes"
          value={formatMoneda(data?.ingresosMes ?? 0)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatsCard
          title="Reservas del Mes"
          value={data?.reservasMes ?? 0}
          icon={CalendarDaysIcon}
          color="blue"
        />
        <StatsCard
          title="Habitaciones Disponibles"
          value={data?.habitacionesDisponibles ?? 0}
          icon={HomeIcon}
          color="yellow"
        />
        <StatsCard
          title="Habitaciones Ocupadas"
          value={data?.habitacionesOcupadas ?? 0}
          icon={LockClosedIcon}
          color="red"
        />
      </div>

      {/* Extra metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Métricas Adicionales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {extra.map(({ label, value, icon: Icon, cls }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div className={`p-2 rounded-lg ${cls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{label}</p>
                <p className="text-base font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
