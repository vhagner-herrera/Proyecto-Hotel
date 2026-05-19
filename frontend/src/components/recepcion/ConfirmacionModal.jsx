import { CheckCircleIcon, DocumentArrowDownIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { formatMoneda } from '../../utils/formatters';
import { getBoleta, descargarBoletaPDF } from '../../api/pagos.api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ConfirmacionModal({ isOpen, reserva }) {
  const navigate = useNavigate();
  const [descargando, setDescargando] = useState(false);

  if (!isOpen || !reserva) return null;

  const handleDescargar = async () => {
    setDescargando(true);
    try {
      const boletaRes = await getBoleta(reserva.id);
      const pdfRes = await descargarBoletaPDF(boletaRes.data.id);
      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-${reserva.codigoReserva}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('La boleta aún se está procesando. Inténtalo en unos segundos.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">¡Reserva Creada!</h2>
        <p className="text-sm text-gray-500 mb-5">El pago y la boleta están siendo procesados</p>

        {/* Codigo */}
        <div className="bg-[#1e3a5f] rounded-xl px-5 py-3 mb-5">
          <p className="text-white/70 text-xs mb-0.5">Código de reserva</p>
          <p className="text-[#c9a84c] text-2xl font-bold tracking-widest">
            {reserva.codigoReserva}
          </p>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
          <Row label="Cliente" value={reserva.clienteNombreCompleto} />
          <Row label="Habitación" value={`N° ${reserva.numeroHabitacion}`} />
          <Row label="Check-in" value={reserva.fechaCheckin} />
          <Row label="Check-out" value={reserva.fechaCheckout} />
          <Row label="Noches" value={reserva.cantidadNoches} />
          <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-2">
            <span>Total pagado</span>
            <span className="text-green-600">{formatMoneda(reserva.montoTotal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDescargar}
            disabled={descargando}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-700
              disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            {descargando ? 'Descargando...' : 'Descargar Boleta PDF'}
          </button>
          <button
            onClick={() => navigate('/recepcion')}
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-300
              text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HomeIcon className="w-4 h-4" />
            Volver a Habitaciones
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
