import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getReservas } from '../../api/reservas.api';
import { getBoleta, descargarBoletaPDF } from '../../api/pagos.api';
import TablaReservas from '../../components/recepcion/TablaReservas';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <svg className="animate-spin h-7 w-7 text-[#1e3a5f]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getReservas();
        setReservas(res.data);
      } catch {
        toast.error('Error al cargar las reservas');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleDescargarBoleta = async (idReserva, codigoReserva) => {
    const toastId = toast.loading('Obteniendo boleta...');
    try {
      const boletaRes = await getBoleta(idReserva);
      toast.loading('Generando PDF...', { id: toastId });
      const pdfRes = await descargarBoletaPDF(boletaRes.data.id);
      const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-${codigoReserva}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Boleta descargada', { id: toastId });
    } catch {
      toast.error('No se pudo obtener la boleta. El pago puede estar procesándose.', { id: toastId });
    }
  };

  const totalPaginas = Math.ceil(reservas.length / PAGE_SIZE);
  const paginadas = reservas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reservas</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} registrada{reservas.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? <Spinner /> : (
          <TablaReservas reservas={paginadas} onDescargarBoleta={handleDescargarBoleta} />
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700
              hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">Página {pagina} de {totalPaginas}</span>
          <button
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700
              hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
