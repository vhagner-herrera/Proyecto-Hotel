import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

export default function TemporizadorEstadia({ reserva }) {
  const [tiempoRestante, setTiempoRestante] = useState({
    horas: 0,
    minutos: 0,
    segundos: 0,
    expirado: false,
    textoFormateado: '00:00:00',
  });

  useEffect(() => {
    // Calcular tiempo objetivo de salida (Checkout)
    let fechaObjetivo;
    if (reserva?.createdAt) {
      const creacion = new Date(reserva.createdAt).getTime();
      const duracionMs = (reserva.cantidadNoches || 1) * 24 * 60 * 60 * 1000;
      fechaObjetivo = creacion + duracionMs;
    } else if (reserva?.fechaCheckout) {
      fechaObjetivo = new Date(`${reserva.fechaCheckout}T12:00:00`).getTime();
    } else {
      // Fallback a 12 horas por defecto si no hay datos de reserva
      fechaObjetivo = Date.now() + 12 * 60 * 60 * 1000;
    }

    const calcular = () => {
      const ahora = Date.now();
      const difMs = fechaObjetivo - ahora;

      if (difMs <= 0) {
        setTiempoRestante({
          horas: 0,
          minutos: 0,
          segundos: 0,
          expirado: true,
          textoFormateado: 'Tiempo Expirado',
        });
        return;
      }

      const totalSegundos = Math.floor(difMs / 1000);
      const h = Math.floor(totalSegundos / 3600);
      const m = Math.floor((totalSegundos % 3600) / 60);
      const s = totalSegundos % 60;

      const pad = (n) => String(n).padStart(2, '0');
      const texto = h > 24 
        ? `${Math.floor(h / 24)}d ${pad(h % 24)}:${pad(m)}:${pad(s)}`
        : `${pad(h)}:${pad(m)}:${pad(s)}`;

      setTiempoRestante({
        horas: h,
        minutos: m,
        segundos: s,
        expirado: false,
        textoFormateado: texto,
      });
    };

    calcular();
    const timer = setInterval(calcular, 1000);

    return () => clearInterval(timer);
  }, [reserva]);

  const { expirado, horas, minutos, textoFormateado } = tiempoRestante;

  // Estilos según el tiempo restante
  let colorEstilo = 'bg-green-50 text-green-700 border-green-200';
  if (expirado) {
    colorEstilo = 'bg-red-100 text-red-800 border-red-300 animate-pulse font-bold';
  } else if (horas === 0 && minutos < 30) {
    colorEstilo = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold transition-all ${colorEstilo}`}>
      <ClockIcon className={`w-3.5 h-3.5 ${expirado ? 'animate-spin' : ''}`} />
      <span>{textoFormateado}</span>
    </div>
  );
}
