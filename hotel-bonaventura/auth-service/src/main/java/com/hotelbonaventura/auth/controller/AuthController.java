package com.hotelbonaventura.auth.controller;

import com.hotelbonaventura.auth.dto.AuthResponseDTO;
import com.hotelbonaventura.auth.dto.LoginRequestDTO;
import com.hotelbonaventura.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST para el endpoint de autenticacion.
 *
 * Ruta base: /api/auth
 * Esta ruta es PUBLICA (permitida sin JWT en SecurityConfig y en el Gateway).
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     *
     * Autentica al usuario y retorna un token JWT.
     *
     * @param request Cuerpo con correo y contrasena (validado con @Valid)
     * @return 200 OK con token JWT y datos del usuario, o 401 si las credenciales son invalidas
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        // Solo loggear el correo, NUNCA la contrasena
        log.info("Peticion de login recibida para: {}", request.getCorreo());

        AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
