export const formatFecha = (fecha) =>
  new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatMoneda = (monto) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto);

export const formatNombre = (str) =>
  str?.trim().replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) ?? '';
