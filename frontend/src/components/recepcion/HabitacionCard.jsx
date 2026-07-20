import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatMoneda } from '../../utils/formatters';
import { cambiarEstadoHabitacion } from '../../api/habitaciones.api';
import useHabitacionesStore from '../../store/habitacionesStore';
import TemporizadorEstadia from './TemporizadorEstadia';
import ModalFinalizarEstadia from './ModalFinalizarEstadia';

const ESTADO_STYLES = {
  DISPONIBLE:    'bg-green-100 text-green-800 border-green-300',
  OCUPADA:       'bg-red-100 text-red-800 border-red-300',
  MANTENIMIENTO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const CARD_BORDER = {
  DISPONIBLE:    'border-green-200 hover:border-green-400',
  OCUPADA:       'border-red-200 shadow-sm',
  MANTENIMIENTO: 'border-yellow-200',
};

export default function HabitacionCard({ habitacion, reservaActiva }) {
  const navigate = useNavigate();
  const { id, numero, tipo, precioPorNoche, estado } = habitacion;
  const disponible = estado === 'DISPONIBLE';
  const ocupada = estado === 'OCUPADA';
  
  const [procesando, setProcesando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const handleConfirmarFinalizacion = async () => {
    setProcesando(true);
    try {
      await cambiarEstadoHabitacion(id, 'DISPONIBLE');
      useHabitacionesStore.getState().liberarHabitacion(id);
      toast.success(`Estadía finalizada. Habitación N° ${numero} ahora está DISPONIBLE.`);
      setModalAbierto(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al finalizar la estadía');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all relative
          ${CARD_BORDER[estado] ?? 'border-gray-200'}
          ${disponible ? 'shadow-sm hover:shadow-md cursor-default' : ''}`}
      >
        {/* Room number */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
          ocupada ? 'bg-red-600' : 'bg-[#1e3a5f]'
        }`}>
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

        {/* Temporizador de cuenta regresiva cuando está OCUPADA */}
        {ocupada && (
          <div className="mt-1 flex flex-col items-center gap-1.5 w-full">
            <TemporizadorEstadia reserva={reservaActiva} />
            
            <button
              onClick={() => setModalAbierto(true)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 bg-red-600 hover:bg-red-700
                text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              title="Finalizar estadía antes de tiempo o al terminar el horario"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Finalizar Estadía
            </button>
          </div>
        )}

        {/* Acciones para disponible */}
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

      {/* Ventana Modal Centrada de Confirmación */}
      <ModalFinalizarEstadia
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onConfirm={handleConfirmarFinalizacion}
        numeroHabitacion={numero}
        tipoHabitacion={tipo}
        loading={procesando}
      />
    </>
  );
}
