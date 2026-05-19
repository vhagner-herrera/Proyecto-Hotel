import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ESTADO_BADGE = {
  CONFIRMADA: 'bg-green-100 text-green-800',
  CANCELADA:  'bg-red-100 text-red-800',
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  COMPLETADA: 'bg-blue-100 text-blue-800',
};

export default function TablaReservas({ reservas, onDescargarBoleta }) {
  if (!reservas?.length) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        No hay reservas registradas.
      </div>
    );
  }

  const fmt = (d) => {
    try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Código</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Cliente</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Hab.</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Check-in</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Check-out</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Estado</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">Boleta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reservas.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e3a5f]">
                {r.codigoReserva}
              </td>
              <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">
                {r.clienteNombreCompleto}
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-800">
                {r.numeroHabitacion ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">{fmt(r.fechaCheckin)}</td>
              <td className="px-4 py-3 text-gray-600">{fmt(r.fechaCheckout)}</td>
              <td className="px-4 py-3 text-center">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_BADGE[r.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.estado}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onDescargarBoleta(r.id, r.codigoReserva)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                    text-green-700 bg-green-50 border border-green-200 rounded-lg
                    hover:bg-green-100 transition-colors"
                  title="Descargar boleta PDF"
                >
                  <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
