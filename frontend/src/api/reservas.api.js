import api from './axios.config';

export const getReservas = () => api.get('/reservas');
export const getReserva = (id) => api.get(`/reservas/${id}`);
export const consultarDni = (dni) => api.get(`/reservas/consultar-dni/${dni}`);
// El header X-User-Email lo inyecta el Gateway a partir del JWT
export const procesarCheckin = (data) => api.post('/reservas/checkin', data);
export const getReservasPorCliente = (dni) => api.get(`/reservas/cliente/${dni}`);
