package com.hotelbonaventura.auth.service;

import com.hotelbonaventura.auth.dto.AuthResponseDTO;
import com.hotelbonaventura.auth.dto.LoginRequestDTO;

/**
 * Contrato del servicio de autenticacion.
 * La implementacion esta en AuthServiceImpl.
 */
public interface AuthService {

    /**
     * Valida las credenciales del usuario y genera un token JWT.
     *
     * @param request DTO con correo y contrasena en texto plano
     * @return DTO con el token JWT y datos del usuario autenticado
     * @throws org.springframework.security.authentication.BadCredentialsException
     *         si las credenciales son invalidas o el usuario esta inactivo
     */
    AuthResponseDTO login(LoginRequestDTO request);
}
