import { useEffect, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  PrinterIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getReportesIngresos } from '../../api/admin.api';
import StatsCard from '../../components/admin/StatsCard';
import GraficoIngresos from '../../components/admin/GraficoIngresos';
import { formatMoneda } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

const DATE_INPUT_CLS =
  'px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white shadow-2xs';

export default function ReportesIngresosPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const firstDay = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReporte = (inicio, fin) =>
    getReportesIngresos(inicio, fin)
      .then((res) => setData(res.data))
      .catch(() => toast.error('Error al cargar el reporte de ingresos'))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchReporte(firstDay, today);
  }, []);

  const handleFiltrar = () => {
    if (fechaInicio > fechaFin) {
      toast.error('La fecha de inicio no puede ser mayor a la fecha fin');
      return;
    }
    setLoading(true);
    fetchReporte(fechaInicio, fechaFin);
  };

  const handleImprimir = () => {
    window.print();
  };

  const detalles = data?.detallesPorDia ?? data?.detalle ?? [];
  const totalIngresos = data?.totalIngresos ?? 0;
  const totalBase = data?.totalBaseImponible ?? data?.totalBase ?? 0;
  const totalIgv = data?.totalIGV ?? data?.totalIgv ?? 0;
  const cantidadBoletas = data?.cantidadBoletas ?? data?.totalBoletas ?? 0;
  const cantidadReservas = data?.cantidadReservas ?? data?.totalReservas ?? cantidadBoletas;

  // Fechas Pico (Los 3 días con mayores ingresos)
  const fechasPico = [...detalles]
    .sort((a, b) => Number(b.ingresos || 0) - Number(a.ingresos || 0))
    .slice(0, 3);

  return (
    <div className="space-y-6 print:p-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reporte Completo de Ingresos y Reservas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Balance detallado, desglose por fechas e historial de boletas emitidas
          </p>
        </div>

        {data && (
          <button
            onClick={handleImprimir}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#152b47]
              text-white text-sm font-semibold rounded-lg shadow-2xs transition-colors print:hidden"
          >
            <PrinterIcon className="w-4 h-4" />
            Imprimir Reporte Completo
          </button>
        )}
      </div>

      {/* Filters (Hidden during print) */}
      <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 print:hidden">
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
              text-sm font-semibold rounded-lg transition-colors shadow-2xs"
          >
            {loading ? 'Cargando...' : 'Filtrar Rango'}
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : data ? (
        <>
          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Ingresos"
              value={formatMoneda(totalIngresos)}
              icon={CurrencyDollarIcon}
              color="green"
            />
            <StatsCard
              title="Total Reservas"
              value={cantidadReservas}
              icon={CalendarDaysIcon}
              color="blue"
            />
            <StatsCard
              title="Boletas Emitidas"
              value={cantidadBoletas}
              icon={DocumentTextIcon}
              color="indigo"
            />
            <StatsCard
              title="Total IGV (18%)"
              value={formatMoneda(totalIgv)}
              icon={ReceiptPercentIcon}
              color="yellow"
            />
          </div>

          {/* Fechas Pico / Días de Mayor Demanda */}
          {fechasPico.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">
                  Fechas Pico con Mayor Demanda en el Período
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {fechasPico.map((item, index) => (
                  <div key={item.fecha} className="bg-white rounded-lg p-3 border border-amber-200/50 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
                      <span>Top #{index + 1}</span>
                      <span>{item.fecha}</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">{formatMoneda(item.ingresos)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.boletas} boletas / reservas</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {detalles.length > 0 && (
            <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 print:break-inside-avoid">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolución Diaria de Ingresos</h3>
              <GraficoIngresos detalle={detalles} />
            </div>
          )}

          {/* Detailed Table */}
          <div className="bg-white rounded-xl shadow-2xs border border-gray-100 overflow-hidden print:border-none">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Detalle Diario de Reservas e Ingresos</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Del {fechaInicio} al {fechaFin}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {detalles.length} días registrados
              </span>
            </div>
            {detalles.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Boletas / Reservas</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Base Imponible</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">IGV (18%)</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalles.map((d) => {
                      const ing = Number(d.ingresos || 0);
                      const base = ing / 1.18;
                      const igv = ing - base;
                      return (
                        <tr key={d.fecha} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{d.fecha}</td>
                          <td className="px-4 py-3 text-right text-gray-700 font-medium">{d.boletas}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatMoneda(base)}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatMoneda(igv)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatMoneda(ing)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100/80 font-bold border-t-2 border-gray-200 text-gray-900">
                      <td className="px-4 py-3">TOTAL GENERAL</td>
                      <td className="px-4 py-3 text-right">{cantidadBoletas}</td>
                      <td className="px-4 py-3 text-right">{formatMoneda(totalBase)}</td>
                      <td className="px-4 py-3 text-right">{formatMoneda(totalIgv)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatMoneda(totalIngresos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">
                Sin datos registrados para el rango de fechas seleccionado.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
