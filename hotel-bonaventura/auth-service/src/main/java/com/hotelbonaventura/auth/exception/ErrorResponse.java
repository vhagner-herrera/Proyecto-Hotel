package com.hotelbonaventura.auth.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Estructura estandar de respuesta de error para todos los endpoints.
 *
 * Ejemplo:
 * {
 *   "timestamp": "2026-05-18T10:30:00",
 *   "status": 401,
 *   "error": "Unauthorized",
 *   "message": "Credenciales invalidas",
 *   "path": "/api/auth/login"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private int status;
    private String error;
    private String message;
    private String path;
}
