export const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatMoneda = (monto) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);
