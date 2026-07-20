import { useEffect, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { getReportesIngresos } from '../../api/admin.api';
import StatsCard from '../../components/admin/StatsCard';
import GraficoIngresos from '../../components/admin/GraficoIngresos';
import { formatMoneda } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const DATE_INPUT_CLS =
  'px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20';

export default function ReportesIngresosPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstDay = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // No cambia 'loading' de forma síncrona: quien refresca manualmente activa el spinner antes
  const fetchReporte = (inicio, fin) =>
    getReportesIngresos(inicio, fin)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Error al cargar el reporte de ingresos'))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchReporte(firstDay, today);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiltrar = () => {
    if (fechaInicio > fechaFin) {
      toast.error('La fecha de inicio no puede ser mayor a la fecha fin');
      return;
    }
    setLoading(true);
    fetchReporte(fechaInicio, fechaFin);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reporte de Ingresos</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ingresos filtrados por rango de fechas</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={DATE_INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={DATE_INPUT_CLS}
            />
          </div>
          <button
            onClick={handleFiltrar}
            disabled={loading}
            className="px-5 py-2 bg-[#1e3a5f] hover:bg-[#152b47] disabled:opacity-60 text-white
              text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Ingresos"
              value={formatMoneda(data?.totalIngresos ?? 0)}
              icon={CurrencyDollarIcon}
              color="green"
            />
            <StatsCard
              title="Total Base"
              value={formatMoneda(data?.totalBase ?? 0)}
              icon={BanknotesIcon}
              color="blue"
            />
            <StatsCard
              title="Total IGV"
              value={formatMoneda(data?.totalIgv ?? 0)}
              icon={ReceiptPercentIcon}
              color="yellow"
            />
            <StatsCard
              title="Boletas Emitidas"
              value={data?.totalBoletas ?? 0}
              icon={DocumentTextIcon}
              color="indigo"
            />
          </div>

          {/* Bar chart */}
          {data?.detalle?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Ingresos por Día</h3>
              <GraficoIngresos detalle={data.detalle} />
            </div>
          )}

          {/* Detail table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Detalle por Día</h3>
            </div>
            {data?.detalle?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Ingresos</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Boletas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.detalle.map((d) => (
                      <tr key={d.fecha} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{d.fecha}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatMoneda(d.ingresos)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{d.boletas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                Sin datos para el rango seleccionado.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
