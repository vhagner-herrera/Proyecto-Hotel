import api from './axios.config';

// Backend espera { correo, contrasena }
export const login = ({ email, password }) =>
  api.post('/auth/login', { correo: email, contrasena: password });
