package com.hotelbonaventura.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta exitosa del endpoint POST /api/auth/login.
 *
 * Ejemplo:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiJ9...",
 *   "tipo": "Bearer",
 *   "email": "admin@bonaventura.com",
 *   "nombre": "Renzo Administrador",
 *   "rol": "ADMINISTRADOR",
 *   "expiresIn": 86400000
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

    private String token;

    /** Siempre "Bearer". Se inicializa por defecto con @Builder.Default. */
    @Builder.Default
    private String tipo = "Bearer";

    private String email;
    private String nombre;
    private String rol;
    private Long expiresIn;
}
