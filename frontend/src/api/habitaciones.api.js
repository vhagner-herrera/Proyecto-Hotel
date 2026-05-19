import api from './axios.config';

export const getHabitaciones = () => api.get('/habitaciones');
export const getHabitacion = (id) => api.get(`/habitaciones/${id}`);
export const createHabitacion = (data) => api.post('/habitaciones', data);
export const updateHabitacion = (id, data) => api.put(`/habitaciones/${id}`, data);
export const deleteHabitacion = (id) => api.delete(`/habitaciones/${id}`);
export const cambiarEstadoHabitacion = (id, estado) =>
  api.put(
    `/habitaciones/${id}/estado`,
    { estado },
    { headers: { 'X-User-Role': 'ADMINISTRADOR' } }
  );
