import { formatMoneda } from '../../utils/formatters';

export default function GraficoIngresos({ detalle = [] }) {
  if (!detalle.length) return null;

  const max = Math.max(...detalle.map((d) => d.ingresos), 1);

  return (
    <div className="space-y-2">
      {detalle.map((d) => {
        const pct = (d.ingresos / max) * 100;
        return (
          <div key={d.fecha} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-xs text-gray-500 flex-shrink-0 text-right">{d.fecha}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
              <div
                className="h-full bg-[#1e3a5f] rounded-md transition-all duration-500 flex items-center px-2"
                style={{ width: `${Math.max(pct, 2)}%` }}
              >
                {pct > 20 && (
                  <span className="text-white text-xs font-medium truncate">
                    {formatMoneda(d.ingresos)}
                  </span>
                )}
              </div>
            </div>
            {pct <= 20 && (
              <span className="text-xs text-gray-600 w-24 flex-shrink-0">
                {formatMoneda(d.ingresos)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
