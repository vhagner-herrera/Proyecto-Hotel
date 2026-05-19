import api from './axios.config';

export const getReservas = () => api.get('/reservas');
export const getReserva = (id) => api.get(`/reservas/${id}`);
export const consultarDni = (dni) => api.get(`/reservas/consultar-dni/${dni}`);
export const procesarCheckin = (data, userEmail) =>
  api.post('/reservas/checkin', data, {
    headers: userEmail ? { 'X-User-Email': userEmail } : {},
  });
export const getReservasPorCliente = (dni) => api.get(`/reservas/cliente/${dni}`);
