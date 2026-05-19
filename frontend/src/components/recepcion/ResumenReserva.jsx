import { formatMoneda } from '../../utils/formatters';

export default function ResumenReserva({ habitacion, cantidadNoches }) {
  const noches = parseInt(cantidadNoches) || 0;
  const total = noches > 0 ? habitacion.precioPorNoche * noches : 0;

  return (
    <div className="bg-[#1e3a5f] rounded-xl p-5 text-white">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">Resumen</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/70">Habitación</span>
          <span className="font-medium">N° {habitacion.numero} — {habitacion.tipo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Precio / noche</span>
          <span className="font-medium">{formatMoneda(habitacion.precioPorNoche)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Noches</span>
          <span className="font-medium">{noches > 0 ? noches : '—'}</span>
        </div>
        <div className="border-t border-white/20 pt-2 mt-2 flex justify-between items-center">
          <span className="font-semibold text-base">Total a pagar</span>
          <span className="text-xl font-bold text-[#c9a84c]">
            {noches > 0 ? formatMoneda(total) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
