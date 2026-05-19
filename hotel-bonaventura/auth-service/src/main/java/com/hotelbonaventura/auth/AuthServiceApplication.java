package com.hotelbonaventura.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del microservicio de autenticacion de Hotel BonAventura.
 *
 * Responsabilidades:
 *   - Validar credenciales contra la BD Supabase (schema hotel_auth)
 *   - Generar tokens JWT firmados con HS256
 *   - Encriptar y verificar contrasenas con BCrypt (strength 10)
 *
 * Puerto: 8081
 * Endpoint publico: POST /api/auth/login
 */
@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
