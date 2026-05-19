import api from './axios.config';

export const getUsuarios = () => api.get('/admin/usuarios');
export const createUsuario = (data) => api.post('/admin/usuarios', data);
export const updateUsuario = (id, data) => api.put(`/admin/usuarios/${id}`, data);
export const deleteUsuario = (id) => api.delete(`/admin/usuarios/${id}`);

export const getDashboard = () => api.get('/admin/reportes/dashboard');
export const getReportesIngresos = (fechaInicio, fechaFin) =>
  api.get('/admin/reportes/ingresos', { params: { fechaInicio, fechaFin } });
export const getReportesOcupacion = () => api.get('/admin/reportes/ocupacion');

export const getParametros = () => api.get('/admin/parametros');
export const updateParametro = (clave, valor) =>
  api.put(`/admin/parametros/${clave}`, { valor });
