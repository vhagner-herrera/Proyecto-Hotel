import api from './axios.config';

export const getPagos = () => api.get('/pagos');
export const getPago = (id) => api.get(`/pagos/${id}`);
export const getBoleta = (idReserva) => api.get(`/pagos/boletas/reserva/${idReserva}`);
export const descargarBoletaPDF = (idBoleta) =>
  api.get(`/pagos/boletas/${idBoleta}/pdf`, { responseType: 'blob' });
