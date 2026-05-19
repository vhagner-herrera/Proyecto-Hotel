package com.hotelbonaventura.auth.service.impl;

import com.hotelbonaventura.auth.dto.AuthResponseDTO;
import com.hotelbonaventura.auth.dto.LoginRequestDTO;
import com.hotelbonaventura.auth.entity.Usuario;
import com.hotelbonaventura.auth.repository.UsuarioRepository;
import com.hotelbonaventura.auth.service.AuthService;
import com.hotelbonaventura.auth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Implementacion del servicio de autenticacion.
 *
 * Flujo del metodo login:
 *   1. Buscar usuario por correo en la BD
 *   2. Verificar que el usuario exista (sin revelar si el correo es valido)
 *   3. Verificar que el estado sea ACTIVO
 *   4. Comparar la contrasena con BCrypt
 *   5. Generar token JWT con los datos del usuario
 *   6. Retornar el AuthResponseDTO
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${JWT_EXPIRATION}")
    private Long jwtExpiration;

    @Override
    public AuthResponseDTO login(LoginRequestDTO request) {
        log.info("Intento de login para el correo: {}", request.getCorreo());

        // Paso 1: Buscar usuario por correo
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> {
                    // Mensaje generico: no revelar si el correo existe en el sistema
                    log.warn("Login fallido: correo no encontrado [{}]", request.getCorreo());
                    return new BadCredentialsException("Credenciales invalidas");
                });

        // Paso 2: Verificar que el usuario este ACTIVO
        if (!"ACTIVO".equalsIgnoreCase(usuario.getEstado())) {
            log.warn("Login fallido: usuario inactivo [{}]", request.getCorreo());
            throw new BadCredentialsException("Usuario inactivo. Contacte al administrador.");
        }

        // Paso 3: Validar contrasena con BCrypt
        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasena())) {
            // Nunca indicar que el correo si existe pero la contrasena fallo
            log.warn("Login fallido: contrasena incorrecta para [{}]", request.getCorreo());
            throw new BadCredentialsException("Credenciales invalidas");
        }

        // Paso 4: Generar token JWT
        String token = jwtUtil.generateToken(usuario);

        log.info("Login exitoso para: {} | Rol: {}", usuario.getCorreo(), usuario.getRol());

        // Paso 5: Construir y retornar la respuesta
        return AuthResponseDTO.builder()
                .token(token)
                .email(usuario.getCorreo())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol())
                .expiresIn(jwtExpiration)
                .build();
    }
}
