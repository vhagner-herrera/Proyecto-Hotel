function pctBadge(pct) {
  if (pct >= 70) return 'bg-red-100 text-red-700';
  if (pct >= 40) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

export default function TablaOcupacion({ tipos }) {
  if (!tipos?.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Sin datos de ocupación por tipo.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Total</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Disponibles</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Ocupadas</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">% Ocupación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tipos.map((t) => {
            const pct = t.total > 0 ? ((t.ocupadas / t.total) * 100).toFixed(1) : '0.0';
            return (
              <tr key={t.tipo} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{t.tipo}</td>
                <td className="px-4 py-3 text-center text-gray-700">{t.total}</td>
                <td className="px-4 py-3 text-center font-semibold text-green-600">{t.disponibles}</td>
                <td className="px-4 py-3 text-center font-semibold text-red-600">{t.ocupadas}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pctBadge(Number(pct))}`}>
                    {pct}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
