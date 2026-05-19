import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { formatMoneda } from '../../utils/formatters';

const ESTADO_STYLES = {
  DISPONIBLE:    'bg-green-100 text-green-800 border-green-300',
  OCUPADA:       'bg-red-100 text-red-800 border-red-300',
  MANTENIMIENTO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const CARD_BORDER = {
  DISPONIBLE:    'border-green-200 hover:border-green-400',
  OCUPADA:       'border-red-200',
  MANTENIMIENTO: 'border-yellow-200',
};

export default function HabitacionCard({ habitacion }) {
  const navigate = useNavigate();
  const { id, numero, tipo, precioPorNoche, estado } = habitacion;
  const disponible = estado === 'DISPONIBLE';

  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all
        ${CARD_BORDER[estado] ?? 'border-gray-200'}
        ${disponible ? 'shadow-sm hover:shadow-md cursor-default' : 'opacity-75'}`}
    >
      {/* Room number */}
      <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xl font-bold">{numero}</span>
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-800">{tipo}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5">{formatMoneda(precioPorNoche)}</p>
        <p className="text-xs text-gray-400">por noche</p>
      </div>

      {/* Status badge */}
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_STYLES[estado] ?? 'bg-gray-100 text-gray-600 border-gray-300'}`}>
        {estado}
      </span>

      {/* Action */}
      {disponible && (
        <button
          onClick={() => navigate(`/recepcion/checkin/${id}`)}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#1e3a5f] hover:bg-[#152b47]
            text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Procesar Check-in
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
